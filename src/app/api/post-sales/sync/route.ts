/**
 * POST /api/post-sales/sync
 *
 * Motor de sincronização diária:
 * - Busca assinaturas pagas criadas HOJE no Banco 1 (Clone MySQL)
 * - Para cada assinatura nova, cria LeadPostSaleTasks no Banco 2 (Prisma)
 *   conforme as PostSaleSequences ativas.
 * - Idempotente: ignora duplicatas (não cria task se já existe PENDING
 *   para mesma pessoa + sequência).
 *
 * Proteção: requer header Authorization: Bearer <CRON_SECRET>
 * ou sessão de ADMIN (chamada manual pelo painel).
 */

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { PrismaPostSaleRepository } from '@/lib/repositories/PrismaPostSaleRepository';
import { Q_NEW_SUBSCRIPTIONS_IN_RANGE } from '@/lib/queries';
import type { CreateTaskInput } from '@/lib/domain/post-sale.types';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

const repo = new PrismaPostSaleRepository();

interface NewSubscriptionRow {
  subscriptionId: number;
  personId: number;
  planId: number;
  startAt: Date;
  fullName: string;
  email: string;
  phoneNumber: string;
  planTitle: string;
  priceInCents: number;
}

export async function POST(request: Request) {
  // ── Autenticação via CRON_SECRET ou Sessão NextAuth ──────────────────
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  let isAuthorized = false;

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    isAuthorized = true;
  } else {
    // Fallback: check session for manual triggers
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (session && (role === 'ADMIN' || role === 'POST_SALES')) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const targetDate: string = body.date || new Date().toISOString().slice(0, 10);

    const dayStart = `${targetDate} 00:00:00`;
    const dayEnd   = `${targetDate} 23:59:59`;

    // 1. Carrega sequências ativas do Banco 2
    const sequences = await repo.listSequences(true);

    if (sequences.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhuma PostSaleSequence ativa configurada.',
        tasksCreated: 0,
        subscriptionsProcessed: 0,
      });
    }

    // 2. Import queries
    const { 
      Q_NEW_SUBSCRIPTIONS_IN_RANGE, 
      Q_BOOK_ONLY_LEADS, 
      Q_PROMO_LEADS, 
      Q_COURTESY_LEADS 
    } = await import('@/lib/queries');

    // 3. Executa queries em paralelo
    const [
      [newSubsRows],
      [bookOnlyRows],
      [promoRows],
      [courtesyRows]
    ] = await Promise.all([
      pool.query(Q_NEW_SUBSCRIPTIONS_IN_RANGE, [dayStart, dayEnd]),
      pool.query(Q_BOOK_ONLY_LEADS),
      pool.query(Q_PROMO_LEADS),
      pool.query(Q_COURTESY_LEADS),
    ]);

    const newSubs = newSubsRows as any[];
    const bookOnly = bookOnlyRows as any[];
    const promo = promoRows as any[];
    const courtesy = courtesyRows as any[];

    // 4. Mapear leads para as sequências
    const pendingAssignments: Array<{ personId: number; seq: any; startAt: Date; planId?: number; planTitle?: string }> = [];

    // 4a. Paid/All (novas assinaturas)
    for (const sub of newSubs) {
      for (const seq of sequences.filter(s => s.targetSegment === 'all' || s.targetSegment === 'paid')) {
        pendingAssignments.push({ personId: sub.personId, seq, startAt: new Date(sub.startAt), planId: sub.planId, planTitle: sub.planTitle });
      }
    }
    
    // 4b. Book Only
    for (const sub of bookOnly) {
      for (const seq of sequences.filter(s => s.targetSegment === 'book_only')) {
        pendingAssignments.push({ personId: sub.personId, seq, startAt: new Date(sub.registeredAt) });
      }
    }

    // 4c. Promo
    for (const sub of promo) {
      for (const seq of sequences.filter(s => s.targetSegment === 'promo')) {
        pendingAssignments.push({ personId: sub.personId, seq, startAt: new Date(sub.trialStartAt || sub.registeredAt), planTitle: sub.planTitle });
      }
    }

    // 4d. Courtesy
    for (const sub of courtesy) {
      for (const seq of sequences.filter(s => s.targetSegment === 'courtesy')) {
        pendingAssignments.push({ personId: sub.personId, seq, startAt: new Date(sub.subscriptionStart), planId: sub.planId, planTitle: sub.planTitle });
      }
    }

    if (pendingAssignments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum lead qualificado para as sequências ativas hoje.',
        tasksCreated: 0,
        subscriptionsProcessed: newSubs.length,
      });
    }

    // 5. Bulk Check de duplicidade (Performance O(1))
    const uniquePersonIds = [...new Set(pendingAssignments.map(a => a.personId))];
    const uniqueSequenceIds = [...new Set(pendingAssignments.map(a => a.seq.id))];

    const existingTasks = await prisma.task.findMany({
      where: {
        customer: { externalPersonId: { in: uniquePersonIds } },
        automationId: { in: uniqueSequenceIds },
        OR: [
          { taskType: 'POST_SALE' },
          { automation: { triggerEvent: 'POST_SALE' } }
        ]
      },
      select: { automationId: true, customer: { select: { externalPersonId: true } } }
    });

    const existingTaskSet = new Set(
      existingTasks.map(t => `${t.customer.externalPersonId}_${t.automationId}`)
    );

    // 6. Preparar Tasks
    const tasksToCreate: CreateTaskInput[] = [];
    let skipped = 0;

    for (const assign of pendingAssignments) {
      if (existingTaskSet.has(`${assign.personId}_${assign.seq.id}`)) {
        skipped++;
        continue;
      }

      const scheduledFor = new Date(assign.startAt);
      scheduledFor.setDate(scheduledFor.getDate() + assign.seq.triggerDays);

      tasksToCreate.push({
        externalPersonId: assign.personId,
        sequenceId: assign.seq.id,
        scheduledFor,
        snapshotPlanId: assign.planId,
        snapshotPlanName: assign.planTitle,
      });
    }

    // 7. Cria tasks em lote
    const created = await repo.createManyTasks(tasksToCreate);

    return NextResponse.json({
      success: true,
      date: targetDate,
      subscriptionsProcessed: newSubs.length + bookOnly.length + promo.length + courtesy.length,
      sequencesApplied: sequences.length,
      tasksCreated: created,
      tasksSkipped: skipped,
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[post-sales/sync] Error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/** GET /api/post-sales/sync — Retorna status e estatísticas do motor */
export async function GET() {
  try {
    const sequences = await repo.listSequences(true);
    const pendingCount = (await repo.getPendingAlerts()).length;

    return NextResponse.json({
      activeSequences: sequences.length,
      pendingAlerts: pendingCount,
      sequences: sequences.map(s => ({
        id: s.id,
        name: s.name,
        triggerDays: s.triggerDays,
        targetSegment: s.targetSegment,
        isActive: s.isActive,
      })),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

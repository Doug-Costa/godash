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
  // ── Autenticação básica via CRON_SECRET ou header interno ──────────────────
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const targetDate: string = body.date || new Date().toISOString().slice(0, 10);

    // Janela de sincronização: início e fim do dia alvo
    const dayStart = `${targetDate} 00:00:00`;
    const dayEnd   = `${targetDate} 23:59:59`;

    // 1. Busca novas assinaturas pagas do dia no Banco 1
    const [rows] = await pool.query(Q_NEW_SUBSCRIPTIONS_IN_RANGE, [dayStart, dayEnd]);
    const newSubs = rows as NewSubscriptionRow[];

    if (newSubs.length === 0) {
      return NextResponse.json({
        success: true,
        message: `Nenhuma nova assinatura em ${targetDate}.`,
        tasksCreated: 0,
        subscriptionsProcessed: 0,
      });
    }

    // 2. Carrega sequências ativas do Banco 2
    const sequences = await repo.listSequences(true);

    if (sequences.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhuma PostSaleSequence ativa configurada.',
        tasksCreated: 0,
        subscriptionsProcessed: newSubs.length,
      });
    }

    // 3. Para cada assinatura × cada sequência, verifica e cria a task
    const tasksToCreate: CreateTaskInput[] = [];
    const skipped: number[] = [];

    for (const sub of newSubs) {
      for (const seq of sequences) {
        // Verifica segmento alvo
        if (seq.targetSegment !== 'all' && seq.targetSegment !== 'paid') {
          continue; // Sequências 'book_only', 'promo', etc. são tratadas separadamente
        }

        // Checa duplicidade
        const alreadyExists = await repo.taskExistsForPersonAndSequence(
          sub.personId,
          seq.id
        );
        if (alreadyExists) {
          skipped.push(sub.personId);
          continue;
        }

        // Calcula data agendada: startAt + triggerDays
        const startAt = new Date(sub.startAt);
        const scheduledFor = new Date(startAt);
        scheduledFor.setDate(scheduledFor.getDate() + seq.triggerDays);

        tasksToCreate.push({
          externalPersonId: sub.personId,
          sequenceId: seq.id,
          scheduledFor,
          snapshotPlanId: sub.planId,
          snapshotPlanName: sub.planTitle,
        });
      }
    }

    // 4. Cria tasks em lote
    const created = await repo.createManyTasks(tasksToCreate);

    return NextResponse.json({
      success: true,
      date: targetDate,
      subscriptionsProcessed: newSubs.length,
      sequencesApplied: sequences.length,
      tasksCreated: created,
      tasksSkipped: skipped.length,
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

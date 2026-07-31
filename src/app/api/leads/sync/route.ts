import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { CustomerCreationService } from '@/lib/application/CustomerCreationService';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const role = (session.user as any).role || 'AGENT';
    if (role !== 'ADMIN') {
      return new Response('Forbidden', { status: 403 });
    }

    // 1. Garantir que as pipelines padrão existem no Postgres
    const defaultPipelines = ['Vendas', 'CS', 'Nutrição'];
    const pipelineMap = new Map<string, string>();

    for (const name of defaultPipelines) {
      const p = await prisma.pipeline.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      pipelineMap.set(name, p.id);
    }

    const vendasPipelineId = pipelineMap.get('Vendas');

    // 2. Buscar dados do MySQL
    // A. Buscar Carrinhos Abandonados (Orphans)
    const queryAbandoned = `
      SELECT
        p.id AS personId,
        p.fullName,
        p.email,
        p.phoneNumber,
        p.createdAt AS registeredAt
      FROM people p
      WHERE p.admin = 0
        AND NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.personId = p.id)
        AND NOT EXISTS (SELECT 1 FROM purchases pu WHERE pu.personId = p.id)
        AND (p.fullName IS NOT NULL AND p.fullName != '' AND p.fullName NOT LIKE '%bot%' AND p.email NOT LIKE '%bot%')
      ORDER BY p.createdAt DESC
      LIMIT 1000
    `;
    const [abandonedRows] = await pool.query(queryAbandoned);
    const abandonedLeads = abandonedRows as any[];

    // B. Buscar Assinaturas Expirando
    const queryExpiring = `
      SELECT
        p.id AS personId,
        p.fullName,
        p.email,
        p.phoneNumber,
        pl.title AS planTitle,
        s.isValidUntil AS expirationDate
      FROM subscriptions s
      JOIN people p ON s.personId = p.id
      JOIN plans pl ON s.planId = pl.id
      WHERE s.status = 'active'
        AND pl.price >= 2000
        AND s.isValidUntil IS NOT NULL
        AND s.isValidUntil >= CURDATE()
        AND s.isValidUntil <= DATE_ADD(CURDATE(), INTERVAL 60 DAY)
      ORDER BY s.isValidUntil ASC
      LIMIT 1000
    `;
    const [expiringRows] = await pool.query(queryExpiring);
    const expiringLeads = expiringRows as any[];

    // 3. Upsert no Postgres
    let abandonedCount = 0;
    for (const lead of abandonedLeads) {
      const externalPersonId = Number(lead.personId);
      if (!externalPersonId || isNaN(externalPersonId)) continue;

      const metadata = {
        fullName: lead.fullName || 'Sem Nome',
        email: lead.email || '',
        phoneNumber: lead.phoneNumber || '',
        registeredAt: lead.registeredAt || new Date().toISOString(),
        type: 'ABANDONED_CART',
      };

      await CustomerCreationService.createOrMerge({
        externalPersonId,
        tag: 'ABANDONED_CART',
        pipelineId: vendasPipelineId,
        metadata,
        source: 'API Sync (Cart)'
      });
      abandonedCount++;
    }

    let expiringCount = 0;
    for (const lead of expiringLeads) {
      const externalPersonId = Number(lead.personId);
      if (!externalPersonId || isNaN(externalPersonId)) continue;

      const metadata = {
        fullName: lead.fullName || 'Sem Nome',
        email: lead.email || '',
        phoneNumber: lead.phoneNumber || '',
        planTitle: lead.planTitle || 'Plano Core',
        expirationDate: lead.expirationDate || null,
        type: 'EXPIRING_SUBSCRIPTION',
      };

      await CustomerCreationService.createOrMerge({
        externalPersonId,
        tag: 'CANCELED_CLIENT',
        pipelineId: vendasPipelineId,
        metadata,
        source: 'API Sync (Expiring)'
      });
      expiringCount++;
    }

    return NextResponse.json({
      success: true,
      data: {
        abandonedCount,
        expiringCount
      }
    });
  } catch (error: any) {
    console.error('[LeadsSyncRoute] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

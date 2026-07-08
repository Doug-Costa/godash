import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import pool from '@/lib/db';
import { AssignCampaignLeadsUseCase } from '@/lib/application/AssignCampaignLeadsUseCase';

export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return new Response('Unauthorized', { status: 403 });
    }

    const campaigns = await prisma.campaign.findMany({
      include: {
        flowSteps: {
          orderBy: { dayOffset: 'asc' }
        },
        _count: {
          select: { leads: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: campaigns });
  } catch (error: any) {
    console.error('GET campaigns error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return new Response('Unauthorized', { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    // 1. Ação de Atribuição (Round Robin) - Legado
    if (action === 'assign') {
      const { campaignId, externalPersonIds, userIds } = body;
      if (!campaignId || !externalPersonIds || !userIds || !Array.isArray(externalPersonIds) || !Array.isArray(userIds)) {
        return NextResponse.json({ success: false, error: 'Parâmetros inválidos para atribuição' }, { status: 400 });
      }

      const useCase = new AssignCampaignLeadsUseCase();
      const results = await useCase.execute(externalPersonIds, campaignId, userIds);

      return NextResponse.json({ success: true, count: results.length, data: results });
    }

    // 2. Ação de Estimativa de Público em Tempo Real (Passo 1 do Wizard)
    if (action === 'estimate') {
      const { plansFilter, statusFilter, expiryDays } = body;

      let query = `
        SELECT COUNT(DISTINCT p.id) as count
        FROM people p
        LEFT JOIN subscriptions s ON s.personId = p.id
        LEFT JOIN plans pl ON s.planId = pl.id
        WHERE p.admin = 0
      `;
      const params: any[] = [];

      // Filtro de planos pagos / cortesias
      if (plansFilter === 'pagos') {
        query += ` AND pl.price > 100`;
      } else if (plansFilter === 'cortesia') {
        query += ` AND pl.price <= 100`;
      }

      // Filtro de status da assinatura
      if (statusFilter === 'active') {
        query += ` AND s.status = 'active'`;
      } else if (statusFilter === 'canceled') {
        query += ` AND s.status = 'canceled' AND NOT EXISTS (
          SELECT 1 FROM subscriptions s2 WHERE s2.personId = p.id AND s2.status = 'active'
        )`;
      } else if (statusFilter === 'expired') {
        query += ` AND s.status = 'active' AND COALESCE(s.isValidUntil, s.expiresIn) < CURDATE()`;
        if (expiryDays && Number(expiryDays) > 0) {
          query += ` AND COALESCE(s.isValidUntil, s.expiresIn) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`;
          params.push(Number(expiryDays));
        }
      }

      const [rows] = await pool.query(query, params);
      const count = (rows as any[])[0]?.count || 0;

      return NextResponse.json({ success: true, count });
    }

    // 3. Ação de Lançamento / Ativação Direta (Wizard Finalizado)
    if (action === 'launch') {
      const { name, plansFilter, statusFilter, expiryDays, userIds, limitPerDay, flowSteps, flowGraph } = body;
      if (!name || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return NextResponse.json({ success: false, error: 'Nome da campanha e operadores são obrigatórios.' }, { status: 400 });
      }

      const targetCriteria = JSON.stringify({ plansFilter, statusFilter, expiryDays });

      // Criar campanha
      const campaign = await prisma.campaign.create({
        data: {
          name,
          status: 'ACTIVE',
          targetCriteria,
          limitPerDay: limitPerDay ? Number(limitPerDay) : null,
          flowGraph: flowGraph ? (typeof flowGraph === 'string' ? flowGraph : JSON.stringify(flowGraph)) : null,
          flowSteps: flowSteps && Array.isArray(flowSteps) ? {
            create: flowSteps.map((step: any) => ({
              dayOffset: Number(step.dayOffset),
              channel: step.channel,
              messageTemplate: step.messageTemplate
            }))
          } : undefined
        }
      });

      // Segmentar público-alvo a partir do MySQL de produção
      let targetQuery = `
        SELECT DISTINCT p.id
        FROM people p
        LEFT JOIN subscriptions s ON s.personId = p.id
        LEFT JOIN plans pl ON s.planId = pl.id
        WHERE p.admin = 0
      `;
      const targetParams: any[] = [];

      if (plansFilter === 'pagos') {
        targetQuery += ` AND pl.price > 100`;
      } else if (plansFilter === 'cortesia') {
        targetQuery += ` AND pl.price <= 100`;
      }

      if (statusFilter === 'active') {
        targetQuery += ` AND s.status = 'active'`;
      } else if (statusFilter === 'canceled') {
        targetQuery += ` AND s.status = 'canceled' AND NOT EXISTS (
          SELECT 1 FROM subscriptions s2 WHERE s2.personId = p.id AND s2.status = 'active'
        )`;
      } else if (statusFilter === 'expired') {
        targetQuery += ` AND s.status = 'active' AND COALESCE(s.isValidUntil, s.expiresIn) < CURDATE()`;
        if (expiryDays && Number(expiryDays) > 0) {
          targetQuery += ` AND COALESCE(s.isValidUntil, s.expiresIn) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`;
          targetParams.push(Number(expiryDays));
        }
      }

      const [rows] = await pool.query(targetQuery, targetParams);
      const externalPersonIds = (rows as any[]).map(r => r.id);

      // Distribuir leads com limitador via Round-Robin
      let resultsCount = 0;
      if (externalPersonIds.length > 0) {
        const useCase = new AssignCampaignLeadsUseCase();
        const results = await useCase.execute(externalPersonIds, campaign.id, userIds);
        resultsCount = results.length;
      }

      return NextResponse.json({ success: true, data: campaign, leadsAssignedCount: resultsCount });
    }

    // 4. Ação de Atualização / Edição
    if (action === 'update') {
      const { campaignId, name, status, flowSteps, targetCriteria, limitPerDay, flowGraph } = body;
      if (!campaignId) {
        return NextResponse.json({ success: false, error: 'campaignId é obrigatório para atualização.' }, { status: 400 });
      }

      if (flowSteps && Array.isArray(flowSteps)) {
        await prisma.flowStep.deleteMany({
          where: { campaignId }
        });
      }

      const campaign = await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          name,
          status,
          targetCriteria: targetCriteria ? (typeof targetCriteria === 'string' ? targetCriteria : JSON.stringify(targetCriteria)) : undefined,
          limitPerDay: limitPerDay ? Number(limitPerDay) : undefined,
          flowGraph: flowGraph ? (typeof flowGraph === 'string' ? flowGraph : JSON.stringify(flowGraph)) : undefined,
          flowSteps: flowSteps && Array.isArray(flowSteps) ? {
            create: flowSteps.map((step: any) => ({
              dayOffset: Number(step.dayOffset),
              channel: step.channel,
              messageTemplate: step.messageTemplate
            }))
          } : undefined
        },
        include: {
          flowSteps: true
        }
      });

      return NextResponse.json({ success: true, data: campaign });
    }

    return NextResponse.json({ success: false, error: 'Ação inválida.' }, { status: 400 });
  } catch (error: any) {
    console.error('POST campaigns error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

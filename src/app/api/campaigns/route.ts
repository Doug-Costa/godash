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

    const journeys = await prisma.journey.findMany({
      include: {
        automations: true,
        _count: {
          select: { customers: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const mappedJourneys = journeys.map(j => ({
      id: j.id,
      name: j.name,
      status: j.status,
      targetCriteria: j.targetCriteria,
      limitPerDay: j.limitPerDay,
      flowGraph: j.flowGraph,
      createdAt: j.createdAt,
      updatedAt: j.updatedAt,
      _count: { leads: j._count.customers },
      flowSteps: j.automations.map(a => {
        const config = a.actionConfig as any;
        return {
          id: a.id,
          dayOffset: config?.dayOffset || 0,
          channel: config?.channel || 'WHATSAPP',
          messageTemplate: config?.messageTemplate || ''
        };
      }).sort((a, b) => a.dayOffset - b.dayOffset)
    }));

    return NextResponse.json({ success: true, data: mappedJourneys });
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

    // 1. Ação de Atribuição (Round Robin)
    if (action === 'assign') {
      const { campaignId, externalPersonIds, userIds } = body;
      if (!campaignId || !externalPersonIds || !userIds || !Array.isArray(externalPersonIds) || !Array.isArray(userIds)) {
        return NextResponse.json({ success: false, error: 'Parâmetros inválidos para atribuição' }, { status: 400 });
      }

      const useCase = new AssignCampaignLeadsUseCase();
      const results = await useCase.execute(externalPersonIds, campaignId, userIds);

      return NextResponse.json({ success: true, count: results.length, data: results });
    }

    // 2. Ação de Estimativa de Público em Tempo Real
    if (action === 'estimate') {
      const { plansFilter, selectedPlans, statusFilter, expiryDays } = body;

      let query = `
        SELECT COUNT(DISTINCT p.id) as count
        FROM people p
        LEFT JOIN subscriptions s ON s.personId = p.id
        LEFT JOIN plans pl ON s.planId = pl.id
        WHERE p.admin = 0
      `;
      const params: any[] = [];

      // Filtro de planos pagos / cortesias
      if (selectedPlans && Array.isArray(selectedPlans) && selectedPlans.length > 0) {
        query += ` AND pl.id IN (${selectedPlans.map(() => '?').join(',')})`;
        params.push(...selectedPlans);
      } else {
        if (plansFilter === 'pagos') {
          query += ` AND pl.price > 100`;
        } else if (plansFilter === 'cortesia') {
          query += ` AND pl.price <= 100`;
        }
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

      if (body.excludeNurturing !== false) {
        const nurturingCustomers = await prisma.customer.findMany({
          where: { isInNurturing: true },
          select: { externalPersonId: true }
        });
        const nurturingIds = nurturingCustomers.map(nc => nc.externalPersonId);
        if (nurturingIds.length > 0) {
          query += ` AND p.id NOT IN (${nurturingIds.join(',')})`;
        }
      }

      const [rows] = await pool.query(query, params);
      const count = (rows as any[])[0]?.count || 0;

      // Calculate collisionCount (leads that fit target criteria but are already in nurturing)
      const nurturingCustomers = await prisma.customer.findMany({
        where: { isInNurturing: true },
        select: { externalPersonId: true }
      });
      const nurturingIds = nurturingCustomers.map(nc => nc.externalPersonId);
      let collisionCount = 0;

      if (nurturingIds.length > 0) {
        let collisionQueryStr = `
          SELECT COUNT(DISTINCT p.id) as count
          FROM people p
          LEFT JOIN subscriptions s ON s.personId = p.id
          LEFT JOIN plans pl ON s.planId = pl.id
          WHERE p.admin = 0
            AND p.id IN (${nurturingIds.join(',')})
        `;
        const collisionParams: any[] = [];
        
        if (selectedPlans && Array.isArray(selectedPlans) && selectedPlans.length > 0) {
          collisionQueryStr += ` AND pl.id IN (${selectedPlans.map(() => '?').join(',')})`;
          collisionParams.push(...selectedPlans);
        } else {
          if (plansFilter === 'pagos') {
            collisionQueryStr += ` AND pl.price > 100`;
          } else if (plansFilter === 'cortesia') {
            collisionQueryStr += ` AND pl.price <= 100`;
          }
        }

        if (statusFilter === 'active') {
          collisionQueryStr += ` AND s.status = 'active'`;
        } else if (statusFilter === 'canceled') {
          collisionQueryStr += ` AND s.status = 'canceled' AND NOT EXISTS (
            SELECT 1 FROM subscriptions s2 WHERE s2.personId = p.id AND s2.status = 'active'
          )`;
        } else if (statusFilter === 'expired') {
          collisionQueryStr += ` AND s.status = 'active' AND COALESCE(s.isValidUntil, s.expiresIn) < CURDATE()`;
          if (expiryDays && Number(expiryDays) > 0) {
            collisionQueryStr += ` AND COALESCE(s.isValidUntil, s.expiresIn) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`;
            collisionParams.push(Number(expiryDays));
          }
        }

        const [collisionRows] = await pool.query(collisionQueryStr, collisionParams);
        collisionCount = (collisionRows as any[])[0]?.count || 0;
      }

      return NextResponse.json({ success: true, count, collisionCount });
    }

    // 3. Ação de Lançamento / Ativação Direta (Wizard Finalizado)
    if (action === 'launch') {
      const { name, plansFilter, selectedPlans, statusFilter, expiryDays, userIds, limitPerDay, flowSteps, flowGraph, startDate, campaignNature } = body;
      const nature = campaignNature || 'COMMERCIAL';

      if (nature === 'COMMERCIAL') {
        if (!name || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
          return NextResponse.json({ success: false, error: 'Nome da campanha e operadores são obrigatórios para campanhas comerciais.' }, { status: 400 });
        }
      } else {
        if (!name) {
          return NextResponse.json({ success: false, error: 'Nome da campanha é obrigatório.' }, { status: 400 });
        }
      }

      const targetCriteria = JSON.stringify({ plansFilter, selectedPlans, statusFilter, expiryDays, startDate });

      // Criar jornada e automações
      const journey = await prisma.journey.create({
        data: {
          name,
          status: 'ACTIVE',
          objective: 'Recuperação de Leads',
          campaignNature: nature,
          financialGoal: 0,
          targetCriteria,
          limitPerDay: limitPerDay ? Number(limitPerDay) : null,
          smtpConfigId: body.smtpConfigId || null,
          warmupTemplateId: body.warmupTemplateId || null,
          pipelineId: body.pipelineId || null,
          onWinJourneyId: body.onWinJourneyId || null,
          onLoseJourneyId: body.onLoseJourneyId || null,
          flowGraph: flowGraph ? (typeof flowGraph === 'string' ? flowGraph : JSON.stringify(flowGraph)) : null,
          automations: flowSteps && Array.isArray(flowSteps) ? {
            create: flowSteps.map((step: any, index: number) => ({
              name: `Passo ${index + 1} - ${step.channel}`,
              triggerEvent: 'JOURNEY_STEP',
              actionType: 'CREATE_TASK',
              templateId: step.templateId || null,
              channel: step.channel,
              delay: Number(step.dayOffset),
              provider: step.provider || 'EVOLUTION',
              stepNumber: index + 1,
              delayDays: Number(step.dayOffset),
              actionConfig: {
                dayOffset: Number(step.dayOffset),
                channel: step.channel,
                messageTemplate: step.messageTemplate || '',
                templateId: step.templateId || null,
                provider: step.provider || 'EVOLUTION'
              }
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

      if (selectedPlans && Array.isArray(selectedPlans) && selectedPlans.length > 0) {
        targetQuery += ` AND pl.id IN (${selectedPlans.map(() => '?').join(',')})`;
        targetParams.push(...selectedPlans);
      } else {
        if (plansFilter === 'pagos') {
          targetQuery += ` AND pl.price > 100`;
        } else if (plansFilter === 'cortesia') {
          targetQuery += ` AND pl.price <= 100`;
        }
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

      if (body.excludeNurturing !== false) {
        const nurturingCustomers = await prisma.customer.findMany({
          where: { isInNurturing: true },
          select: { externalPersonId: true }
        });
        const nurturingIds = nurturingCustomers.map(nc => nc.externalPersonId);
        if (nurturingIds.length > 0) {
          targetQuery += ` AND p.id NOT IN (${nurturingIds.join(',')})`;
        }
      }

      const [rows] = await pool.query(targetQuery, targetParams);
      const externalPersonIds = (rows as any[]).map(r => r.id);

      // Distribuir ou enfileirar leads
      let resultsCount = 0;
      if (nature === 'COMMERCIAL' && externalPersonIds.length > 0) {
        const useCase = new AssignCampaignLeadsUseCase();
        const results = await useCase.execute(externalPersonIds, journey.id, userIds, startDate);
        resultsCount = results.length;
      } else if (nature === 'AUTOMATED' && externalPersonIds.length > 0) {
        // Para campanhas automáticas, cria os customers diretamente no funil e agenda os disparos
        for (const personId of externalPersonIds) {
          let targetPipelineId = body.pipelineId;
          if (!targetPipelineId) {
            const defaultPipe = await prisma.pipeline.findFirst({
              where: { name: 'Vendas' }
            });
            targetPipelineId = defaultPipe?.id;
          }

          const customer = await prisma.customer.create({
            data: {
              externalPersonId: Number(personId),
              journeyId: journey.id,
              pipelineId: targetPipelineId,
              stage: 'novo_cadastro',
              joinedJourneyAt: new Date(),
              metadata: {
                fullName: 'Lead Automático',
                type: 'AUTOMATED_CAMPAIGN'
              }
            }
          });

          if (flowSteps && Array.isArray(flowSteps)) {
            const { automationQueue } = await import('@/lib/queue/automationQueue');
            const createdAutomations = await prisma.automation.findMany({
              where: { journeyId: journey.id }
            });
            for (const auto of createdAutomations) {
              const delayMs = auto.delayDays > 0
                ? auto.delayDays * 24 * 60 * 60 * 1000
                : (auto.delay || 0) * 60 * 1000;

              await automationQueue.add(
                'execute-automation',
                {
                  customerId: customer.id,
                  automationId: auto.id,
                  journeyId: journey.id
                },
                { delay: delayMs }
              );
            }
          }
        }
        resultsCount = externalPersonIds.length;
      }

      return NextResponse.json({ success: true, data: journey, leadsAssignedCount: resultsCount });
    }

    // 4. Ação de Salvar Fluxo Estático (sem Leads)
    if (action === 'save-flow') {
      const { name, pipelineId, flowSteps, flowGraph, smtpConfigId, onWinJourneyId, onLoseJourneyId } = body;
      if (!name) {
        return NextResponse.json({ success: false, error: 'Nome do fluxo é obrigatório.' }, { status: 400 });
      }

      const journey = await prisma.journey.create({
        data: {
          name,
          status: 'ACTIVE',
          objective: 'Jornada Automática',
          financialGoal: 0,
          pipelineId: pipelineId || null,
          smtpConfigId: smtpConfigId || null,
          onWinJourneyId: onWinJourneyId || null,
          onLoseJourneyId: onLoseJourneyId || null,
          flowGraph: flowGraph ? (typeof flowGraph === 'string' ? flowGraph : JSON.stringify(flowGraph)) : null,
          automations: flowSteps && Array.isArray(flowSteps) ? {
            create: flowSteps.map((step: any, index: number) => ({
              name: `Passo ${index + 1} - ${step.channel}`,
              triggerEvent: 'JOURNEY_STEP',
              actionType: 'CREATE_TASK',
              templateId: step.templateId || null,
              channel: step.channel,
              delay: Number(step.dayOffset),
              provider: step.provider || 'EVOLUTION',
              stepNumber: index + 1,
              delayDays: Number(step.dayOffset),
              actionConfig: {
                dayOffset: Number(step.dayOffset),
                channel: step.channel,
                messageTemplate: step.messageTemplate || '',
                templateId: step.templateId || null,
                provider: step.provider || 'EVOLUTION'
              }
            }))
          } : undefined
        }
      });

      return NextResponse.json({ success: true, data: journey });
    }

    // 5. Ação de Atualização / Edição
    if (action === 'update') {
      const { campaignId, name, status, flowSteps, targetCriteria, limitPerDay, flowGraph } = body;
      if (!campaignId) {
        return NextResponse.json({ success: false, error: 'campaignId é obrigatório para atualização.' }, { status: 400 });
      }

      if (flowSteps && Array.isArray(flowSteps)) {
        await prisma.automation.deleteMany({
          where: { journeyId: campaignId }
        });
      }

      const journey = await prisma.journey.update({
        where: { id: campaignId },
        data: {
          name,
          status,
          targetCriteria: targetCriteria ? (typeof targetCriteria === 'string' ? targetCriteria : JSON.stringify(targetCriteria)) : undefined,
          limitPerDay: limitPerDay ? Number(limitPerDay) : undefined,
          smtpConfigId: body.smtpConfigId !== undefined ? (body.smtpConfigId || null) : undefined,
          warmupTemplateId: body.warmupTemplateId !== undefined ? (body.warmupTemplateId || null) : undefined,
          pipelineId: body.pipelineId !== undefined ? (body.pipelineId || null) : undefined,
          onWinJourneyId: body.onWinJourneyId !== undefined ? (body.onWinJourneyId || null) : undefined,
          onLoseJourneyId: body.onLoseJourneyId !== undefined ? (body.onLoseJourneyId || null) : undefined,
          flowGraph: flowGraph ? (typeof flowGraph === 'string' ? flowGraph : JSON.stringify(flowGraph)) : undefined,
          automations: flowSteps && Array.isArray(flowSteps) ? {
            create: flowSteps.map((step: any, index: number) => ({
              name: `Passo ${index + 1} - ${step.channel}`,
              triggerEvent: 'JOURNEY_STEP',
              actionType: 'CREATE_TASK',
              templateId: step.templateId || null,
              channel: step.channel,
              delay: Number(step.dayOffset),
              provider: step.provider || 'EVOLUTION',
              stepNumber: index + 1,
              delayDays: Number(step.dayOffset),
              actionConfig: {
                dayOffset: Number(step.dayOffset),
                channel: step.channel,
                messageTemplate: step.messageTemplate || '',
                templateId: step.templateId || null,
                provider: step.provider || 'EVOLUTION'
              }
            }))
          } : undefined
        },
        include: {
          automations: true
        }
      });

      return NextResponse.json({ success: true, data: journey });
    }

    return NextResponse.json({ success: false, error: 'Ação inválida.' }, { status: 400 });
  } catch (error: any) {
    console.error('POST campaigns error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return new Response('Unauthorized', { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    if (!campaignId) {
      return NextResponse.json({ success: false, error: 'campaignId é obrigatório para exclusão.' }, { status: 400 });
    }

    // 1. Encontrar todos os customers associados a essa jornada
    const campaignLeads = await prisma.customer.findMany({
      where: { journeyId: campaignId }
    });

    // Separar os atendidos dos não atendidos
    // Não atendidos: stage = 'novo_cadastro' E interactionCount = 0
    const unattendedLeadIds = campaignLeads
      .filter(l => l.stage === 'novo_cadastro' && l.interactionCount === 0)
      .map(l => l.id);

    const attendedLeadIds = campaignLeads
      .filter(l => !(l.stage === 'novo_cadastro' && l.interactionCount === 0))
      .map(l => l.id);

    // Iniciar transação no Prisma
    await prisma.$transaction([
      // Deletar todas as tarefas pendentes vinculadas a esta jornada
      prisma.task.deleteMany({
        where: {
          customerId: { in: campaignLeads.map(l => l.id) },
          journeyId: campaignId
        }
      }),

      // Deletar os customers não atendidos da jornada
      prisma.customer.deleteMany({
        where: {
          id: { in: unattendedLeadIds }
        }
      }),

      // Desassociar os customers atendidos da jornada (remover FK)
      prisma.customer.updateMany({
        where: {
          id: { in: attendedLeadIds }
        },
        data: {
          journeyId: null,
          joinedJourneyAt: null
        }
      }),

      // Deletar a jornada em si (por cascata deleta as automações)
      prisma.journey.delete({
        where: { id: campaignId }
      })
    ]);

    return NextResponse.json({ success: true, message: 'Campanha excluída e leads não atendidos limpos.' });
  } catch (error: any) {
    console.error('DELETE campaign error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

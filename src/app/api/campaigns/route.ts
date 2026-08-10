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
      pipelineId: j.pipelineId,
      smtpConfigId: j.smtpConfigId,
      onWinJourneyId: j.onWinJourneyId,
      onLoseJourneyId: j.onLoseJourneyId,
      sendingMode: j.sendingMode || 'IMMEDIATE',
      minDelay: j.minDelay ?? 1000,
      maxDelay: j.maxDelay ?? 5000,
      totalEmails: j.totalEmails || 0,
      sentEmails: j.sentEmails || 0,
      failedEmails: j.failedEmails || 0,
      openedEmails: j.openedEmails || 0,
      routingMode: j.routingMode,
      useAccountManager: j.useAccountManager,
      strictSkillMatch: j.strictSkillMatch,
      productId: j.productId,
      createdAt: j.createdAt,
      updatedAt: j.updatedAt,
      _count: { leads: j._count.customers },
      flowSteps: j.automations.map(a => {
        const config = a.actionConfig as any;
        return {
          id: a.id,
          dayOffset: config?.dayOffset || 0,
          channel: config?.channel || 'WHATSAPP',
          messageTemplate: config?.messageTemplate || '',
          templateId: a.templateId || null,
          provider: a.provider || 'EVOLUTION'
        };
      }).sort((a, b) => a.dayOffset - b.dayOffset)
    }));

    return NextResponse.json({ success: true, data: mappedJourneys });
  } catch (error: any) {
    console.error('GET campaigns error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function getMatchingPersonIdsFromSubscriptions(rule: any) {
  const planId = rule.planId || (rule.value !== 'DENTALGO' && rule.value !== 'CSV' && !rule.value?.startsWith('Form Capture:') ? rule.value : null);
  const status = rule.status;
  const startDate = rule.startDate;
  const endDate = rule.endDate;

  let query = `
    SELECT DISTINCT s.personId
    FROM subscriptions s
    LEFT JOIN plans pl ON s.planId = pl.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (planId && planId !== 'all') {
    query += ` AND pl.id = ?`;
    params.push(planId);
  }

  if (status && status !== 'all') {
    const sLower = status.toLowerCase();
    if (sLower === 'active') {
      query += ` AND s.status = 'active'`;
    } else if (sLower === 'canceled') {
      query += ` AND s.status = 'canceled' AND NOT EXISTS (
        SELECT 1 FROM subscriptions s2 WHERE s2.personId = s.personId AND s2.status = 'active'
      )`;
    } else if (sLower === 'expired') {
      query += ` AND s.status = 'active' AND COALESCE(s.isValidUntil, s.expiresIn) < CURDATE()`;
    }
  }

  if (startDate) {
    query += ` AND COALESCE(s.createdAt, s.updatedAt) >= ?`;
    params.push(new Date(startDate));
  }

  if (endDate) {
    query += ` AND COALESCE(s.createdAt, s.updatedAt) <= ?`;
    params.push(new Date(`${endDate}T23:59:59.999Z`));
  }

  const [rows] = await pool.query(query, params);
  return (rows as any[]).map((r) => Number(r.personId)).filter((id) => !isNaN(id));
}

async function buildPrismaWhereFromRules(rules: any[], relation: 'AND' | 'OR', excludeNurturing: boolean) {
  const where: any = {};
  
  if (excludeNurturing) {
    where.isInNurturing = false;
  }
  
  if (!rules || !Array.isArray(rules) || rules.length === 0) {
    return where;
  }
  
  const conditions: any[] = [];
  
  for (const rule of rules) {
    const { dimension, operator, value, planId, status, startDate, endDate, utmSource } = rule;
    if (!dimension) continue;
    
    let cond: any = null;
    const isDentalGo = dimension === 'dentalgo_subscription' || (dimension === 'lead_source' && value === 'DENTALGO');

    if (isDentalGo) {
      const personIds = await getMatchingPersonIdsFromSubscriptions(rule);
      const cpCondition: any = {};
      if (planId && planId !== 'all') cpCondition.productId = planId;
      if (status && status !== 'all') cpCondition.status = status.toUpperCase();
      if (startDate || endDate) {
        const dateCond: any = {};
        if (startDate) dateCond.gte = new Date(startDate);
        if (endDate) dateCond.lte = new Date(`${endDate}T23:59:59.999Z`);
        cpCondition.startDate = dateCond;
      }
      
      const subConditions: any[] = [];
      if (personIds.length > 0) {
        subConditions.push({ externalPersonId: { in: personIds } });
      }
      subConditions.push({ customerProducts: { some: cpCondition } });
      
      cond = { OR: subConditions };
    } else if (dimension === 'lead_source') {
      const isForm = value !== 'CSV' && value !== 'DENTALGO';
      const sourceCond: any = {};
      
      if (isForm) {
        sourceCond.source = value;
        if (utmSource) {
          sourceCond.opportunities = {
            some: {
              utmSource: {
                contains: utmSource
              }
            }
          };
        }
      } else {
        sourceCond.source = value;
      }
      
      if (operator === 'not_equals') {
        cond = { NOT: sourceCond };
      } else {
        cond = sourceCond;
      }
    } else if (dimension === 'congresso' || dimension === 'curso') {
      if (operator === 'not_equals') {
        cond = {
          customerProducts: {
            none: {
              productId: value
            }
          }
        };
      } else {
        cond = {
          customerProducts: {
            some: {
              productId: value
            }
          }
        };
      }
    }
    
    if (cond) {
      conditions.push(cond);
    }
  }
  
  if (conditions.length > 0) {
    if (relation === 'OR') {
      where.OR = conditions;
    } else {
      where.AND = conditions;
    }
  }
  
  return where;
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
      const { rules, rulesRelation, excludeNurturing } = body;

      // Validate date ranges
      if (rules && Array.isArray(rules)) {
        for (const rule of rules) {
          if (rule.dimension === 'dentalgo_subscription' && rule.startDate && rule.endDate) {
            if (rule.startDate > rule.endDate) {
              return NextResponse.json({ success: false, error: 'Erro: Data inicial não pode ser maior que a data final.' }, { status: 400 });
            }
          }
        }
      }

      const prismaWhere = await buildPrismaWhereFromRules(rules, rulesRelation || 'AND', excludeNurturing !== false);

      const count = await prisma.customer.count({
        where: prismaWhere
      });

      const collisionCount = await prisma.customer.count({
        where: {
          ...prismaWhere,
          isInNurturing: true
        }
      });

      return NextResponse.json({ success: true, count, collisionCount });
    }

    // 3. Ação de Lançamento / Ativação Direta (Wizard Finalizado)
    if (action === 'launch') {
      const { name, rules, rulesRelation, userIds, limitPerDay, flowSteps, flowGraph, startDate, campaignNature, excludeNurturing } = body;
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

      // Validate date ranges
      if (rules && Array.isArray(rules)) {
        for (const rule of rules) {
          if (rule.dimension === 'dentalgo_subscription' && rule.startDate && rule.endDate) {
            if (rule.startDate > rule.endDate) {
              return NextResponse.json({ success: false, error: 'Erro: Data inicial não pode ser maior que a data final.' }, { status: 400 });
            }
          }
        }
      }

      const targetCriteria = JSON.stringify({ rules, rulesRelation, startDate, excludeNurturing: excludeNurturing !== false });

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
          routingMode: body.routingMode || 'ROUND_ROBIN',
          useAccountManager: body.useAccountManager === true,
          strictSkillMatch: body.strictSkillMatch === true,
          productId: body.productId || null,
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

      // Segmentar público-alvo a partir do banco unificado
      const prismaWhere = await buildPrismaWhereFromRules(rules, rulesRelation || 'AND', excludeNurturing !== false);
      const matchingCustomers = await prisma.customer.findMany({
        where: prismaWhere,
        select: { id: true }
      });
      const customerIds = matchingCustomers.map(c => c.id);

      if (customerIds.length === 0) {
        return NextResponse.json({ success: false, error: 'Sem clientes elegíveis encontrados para as regras e período registrados.' }, { status: 400 });
      }

      // Distribuir ou enfileirar leads
      let resultsCount = 0;
      if (nature === 'COMMERCIAL' && customerIds.length > 0) {
        const useCase = new AssignCampaignLeadsUseCase();
        const results = await useCase.execute(customerIds, journey.id, userIds, startDate);
        resultsCount = results.length;
      } else if (nature === 'AUTOMATED' && customerIds.length > 0) {
        // Para campanhas automáticas, associa os customers existentes a esta jornada e agenda os disparos
        for (const customerId of customerIds) {
          let targetPipelineId = body.pipelineId;
          if (!targetPipelineId) {
            const defaultPipe = await prisma.pipeline.findFirst({
              where: { name: 'Vendas' }
            });
            targetPipelineId = defaultPipe?.id;
          }

          const customer = await prisma.customer.update({
            where: { id: customerId },
            data: {
              journeyId: journey.id,
              pipelineId: targetPipelineId,
              stage: 'novo_cadastro',
              joinedJourneyAt: new Date(),
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
        resultsCount = customerIds.length;
      }

      return NextResponse.json({ success: true, data: journey, leadsAssignedCount: resultsCount });
    }

    // 4. Ação de Salvar Fluxo Estático (sem Leads)
    if (action === 'save-flow') {
      const { name, pipelineId, flowSteps, flowGraph, smtpConfigId, onWinJourneyId, onLoseJourneyId, sendingMode, minDelay, maxDelay } = body;
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
          sendingMode: sendingMode || 'IMMEDIATE',
          minDelay: minDelay !== undefined ? Number(minDelay) : 1000,
          maxDelay: maxDelay !== undefined ? Number(maxDelay) : 5000,
          flowGraph: flowGraph ? (typeof flowGraph === 'string' ? flowGraph : JSON.stringify(flowGraph)) : null,
          routingMode: body.routingMode || 'ROUND_ROBIN',
          useAccountManager: body.useAccountManager === true,
          strictSkillMatch: body.strictSkillMatch === true,
          productId: body.productId || null,
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
          sendingMode: body.sendingMode !== undefined ? body.sendingMode : undefined,
          minDelay: body.minDelay !== undefined ? Number(body.minDelay) : undefined,
          maxDelay: body.maxDelay !== undefined ? Number(body.maxDelay) : undefined,
          flowGraph: flowGraph ? (typeof flowGraph === 'string' ? flowGraph : JSON.stringify(flowGraph)) : undefined,
          routingMode: body.routingMode !== undefined ? body.routingMode : undefined,
          useAccountManager: body.useAccountManager !== undefined ? (body.useAccountManager === true) : undefined,
          strictSkillMatch: body.strictSkillMatch !== undefined ? (body.strictSkillMatch === true) : undefined,
          productId: body.productId !== undefined ? (body.productId || null) : undefined,
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

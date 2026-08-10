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

function buildPrismaWhereFromRules(rules: any[], relation: 'AND' | 'OR', excludeNurturing: boolean) {
  const where: any = {};
  
  if (excludeNurturing) {
    where.isInNurturing = false;
  }
  
  if (!rules || !Array.isArray(rules) || rules.length === 0) {
    return where;
  }
  
  const conditions: any[] = [];
  
  for (const rule of rules) {
    const { dimension, operator, value } = rule;
    if (!dimension || !operator) continue;
    
    let cond: any = null;
    
    if (dimension === 'lead_source') {
      if (operator === 'equals') {
        cond = { source: value };
      } else if (operator === 'not_equals') {
        cond = { NOT: { source: value } };
      } else if (operator === 'contains') {
        cond = { source: { contains: value } };
      }
    } else if (dimension === 'product_acquired') {
      if (operator === 'equals') {
        cond = { customerProducts: { some: { productId: value } } };
      } else if (operator === 'not_equals') {
        cond = { customerProducts: { none: { productId: value } } };
      } else if (operator === 'contains') {
        cond = { customerProducts: { some: { productId: value } } };
      }
    } else if (dimension === 'product_status') {
      if (operator === 'equals') {
        cond = { customerProducts: { some: { status: value } } };
      } else if (operator === 'not_equals') {
        cond = { customerProducts: { none: { status: value } } };
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
      const prismaWhere = buildPrismaWhereFromRules(rules, rulesRelation || 'AND', excludeNurturing !== false);

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
      const prismaWhere = buildPrismaWhereFromRules(rules, rulesRelation || 'AND', excludeNurturing !== false);
      const matchingCustomers = await prisma.customer.findMany({
        where: prismaWhere,
        select: { id: true }
      });
      const customerIds = matchingCustomers.map(c => c.id);

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

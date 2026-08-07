import prisma from '../prisma';
import { RoutingEngineService } from '../services/RoutingEngineService';

export class AssignCampaignLeadsUseCase {
  async execute(externalPersonIds: number[], campaignId: string, userIds: string[], startDate?: string) {
    // 1. Buscar a jornada (incluindo as automações/passos do fluxo para pré-geração de alertas)
    const journey = await prisma.journey.findUnique({
      where: { id: campaignId },
      include: { automations: true }
    });

    if (!journey) {
      throw new Error('Campanha/Jornada não encontrada.');
    }

    if (journey.routingMode !== 'POOL' && userIds.length === 0) {
      throw new Error('Pelo menos um operador deve ser selecionado para a distribuição da campanha.');
    }

    const defaultPipeline = journey.pipelineId 
      ? null 
      : (await prisma.pipeline.findFirst({ where: { name: 'Vendas' } }) || await prisma.pipeline.findFirst());
    const targetPipelineId = journey.pipelineId || defaultPipeline?.id || null;

    const limitPerDay = journey.limitPerDay;
    const results: { externalPersonId: number; assigneeId: string | null; joinedCampaignAt: Date }[] = [];

    const routingEngine = new RoutingEngineService();

    // Contador de atribuições por operador para aplicar o limitador diário
    const operatorAssignments: Record<string, number> = {};
    for (const uid of userIds) {
      operatorAssignments[uid] = 0;
    }

    // Parse baseline date in UTC explicit to avoid server timezone discrepancies
    let baseDate = new Date();
    if (startDate) {
      const parts = startDate.split('-');
      if (parts.length === 3) {
        baseDate = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0, 0));
      }
    } else {
      baseDate = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate(), 12, 0, 0, 0));
    }

    const now = new Date();
    const tasksToCreate: any[] = [];

    for (let i = 0; i < externalPersonIds.length; i++) {
      const externalPersonId = externalPersonIds[i];
      
      // Obter assigneeId usando o motor de roteamento inteligente
      const assigneeId = await routingEngine.determineAssignee(
        externalPersonId,
        {
          routingMode: journey.routingMode,
          useAccountManager: journey.useAccountManager,
          strictSkillMatch: journey.strictSkillMatch,
          productId: journey.productId
        },
        'AGENT',
        i,
        userIds
      );

      let countForAgent = 0;
      if (assigneeId) {
        if (operatorAssignments[assigneeId] === undefined) {
          operatorAssignments[assigneeId] = 0;
        }
        countForAgent = operatorAssignments[assigneeId]++;
      } else {
        // Se for POOL (ou nulo), escalonamos usando o loop index geral
        countForAgent = i;
      }

      // Calcular o joinedCampaignAt com base no limitPerDay e na data base de início em UTC
      const joinedCampaignAt = new Date(baseDate.getTime());
      if (limitPerDay && limitPerDay > 0) {
        const daysDelay = Math.floor(countForAgent / limitPerDay);
        joinedCampaignAt.setUTCDate(joinedCampaignAt.getUTCDate() + daysDelay);
      }

      let customer = await prisma.customer.findFirst({
        where: { externalPersonId, journeyId: campaignId }
      });

      if (customer) {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: {
            assigneeId,
            joinedJourneyAt: joinedCampaignAt,
            stage: 'novo_cadastro', // Reinicia como "novo_cadastro" (Sem Contato) para o rodízio
            frozenUntil: null,      // Remove qualquer congelamento pré-existente
            freezeReason: null,
            lostReason: null,
            pipelineId: targetPipelineId || undefined,
          }
        });
      } else {
        customer = await prisma.customer.create({
          data: {
            externalPersonId,
            assigneeId,
            journeyId: campaignId,
            joinedJourneyAt: joinedCampaignAt,
            stage: 'novo_cadastro',
            pipelineId: targetPipelineId,
          }
        });
      }

      // 3. Excluir alertas pendentes anteriores para este customer
      await prisma.task.deleteMany({
        where: {
          customerId: customer.id,
          status: 'PENDING'
        }
      });

      // Se a jornada tem warmupTemplateId, agenda o envio da mensagem de aquecimento automática
      if (journey.warmupTemplateId) {
        const { automationQueue } = await import('../queue/automationQueue');
        const delayMs = Math.max(0, joinedCampaignAt.getTime() - now.getTime());
        await automationQueue.add(
          `warmup-${customer.id}`,
          {
            customerId: customer.id,
            journeyId: journey.id,
            warmupTemplateId: journey.warmupTemplateId
          },
          { delay: delayMs }
        );
      }

      // 4. Acumular alertas de tarefas da jornada agendadas em UTC
      if (journey.automations && journey.automations.length > 0) {
        for (const automation of journey.automations) {
          const config = automation.actionConfig as any;
          const dayOffset = typeof config?.dayOffset === 'number' ? config.dayOffset : 0;
          const channel = config?.channel || 'WHATSAPP';

          const scheduledFor = new Date(joinedCampaignAt.getTime());
          scheduledFor.setUTCDate(scheduledFor.getUTCDate() + dayOffset);

          tasksToCreate.push({
            customerId: customer.id,
            assignedToId: assigneeId,
            journeyId: journey.id,
            automationId: automation.id,
            scheduledFor,
            taskType: channel,
            status: 'PENDING'
          });
        }
      }

      results.push({ externalPersonId, assigneeId, joinedCampaignAt: joinedCampaignAt });
    }

    // 5. Inserir tarefas em lotes (batch insert) de 500 registros para otimizar desempenho
    if (tasksToCreate.length > 0) {
      const chunkSize = 500;
      for (let j = 0; j < tasksToCreate.length; j += chunkSize) {
        const chunk = tasksToCreate.slice(j, j + chunkSize);
        await prisma.task.createMany({
          data: chunk
        });
      }
    }

    return results;
  }
}

import prisma from '../prisma';
import { RoutingEngineService } from '../services/RoutingEngineService';
import { DomainEventService } from '@/lib/services/DomainEventService';
import { DomainEventType, ActorType } from '@/lib/domain/events';

export class AssignCampaignLeadsUseCase {
  async execute(customerIdsOrExternalIds: (string | number)[], campaignId: string, userIds: string[], startDate?: string) {
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
    const results: { customerId?: string; externalPersonId?: number | null; assigneeId: string | null; joinedCampaignAt: Date }[] = [];

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

    for (let i = 0; i < customerIdsOrExternalIds.length; i++) {
      const currentId = customerIdsOrExternalIds[i];
      
      // Obter assigneeId usando o motor de roteamento inteligente
      const assigneeId = await routingEngine.determineAssignee(
        currentId,
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
        where: typeof currentId === 'number'
          ? { externalPersonId: currentId, journeyId: campaignId }
          : { id: currentId }
      });

      let personInfo: any = null;
      if (typeof currentId === 'number') {
        try {
          const pool = (await import('../db')).default;
          const [pRows]: any = await pool.query(
            `SELECT COALESCE(NULLIF(fullName, ''), NULLIF(name, ''), email) AS fullName, email, phoneNumber FROM people WHERE id = ?`,
            [currentId]
          );
          if (pRows && pRows[0]) {
            personInfo = pRows[0];
          }
        } catch (e) {
          console.warn(`[AssignCampaignLeads] Could not fetch person ${currentId} from MySQL:`, e);
        }
      }

      // Upsert Person com dados de identidade do MySQL (resolve "Lead #7509" em campanhas)
      if (typeof currentId === 'number' && personInfo) {
        const normalizePhone = (raw: string | null) => {
          if (!raw) return null;
          const d = raw.replace(/\D/g, '');
          if (d.startsWith('55') && (d.length === 12 || d.length === 13)) return `+${d}`;
          if (d.length >= 10 && d.length <= 11) return `+55${d}`;
          return null;
        };
        const cleanEmail = personInfo.email?.toLowerCase().trim() || null;
        const cleanPhone = normalizePhone(personInfo.phoneNumber);
        const cleanName = personInfo.fullName || null;

        let existingPerson = await prisma.person.findFirst({ where: { externalPersonId: currentId } });
        if (existingPerson) {
          await prisma.person.update({
            where: { id: existingPerson.id },
            data: {
              fullName: existingPerson.fullName || cleanName,
              email: existingPerson.email || cleanEmail,
              phoneNumber: existingPerson.phoneNumber || cleanPhone,
            }
          });
        } else {
          existingPerson = await prisma.person.create({
            data: {
              externalPersonId: currentId,
              fullName: cleanName,
              email: cleanEmail,
              phoneNumber: cleanPhone,
              source: 'DENTALGO',
            }
          });
        }

        if (customer && !customer.personId) {
          await prisma.customer.update({
            where: { id: customer.id },
            data: { personId: existingPerson.id }
          });
        }
      }

      if (customer) {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: {
            assigneeId,
            journeyId: campaignId,
            joinedJourneyAt: joinedCampaignAt,
            stage: 'novo_cadastro', // Reinicia como "novo_cadastro" (Sem Contato) para o rodízio
            frozenUntil: null,      // Remove qualquer congelamento pré-existente
            freezeReason: null,
            lostReason: null,
            pipelineId: targetPipelineId || undefined,
          }
        });
      } else {
        if (typeof currentId === 'number') {
          // Encontrar ou criar Person
          let person = await prisma.person.findFirst({ where: { externalPersonId: currentId } });
          if (!person) {
            person = await prisma.person.create({
              data: {
                externalPersonId: currentId,
                source: 'DENTALGO',
              }
            });
          }

          customer = await prisma.customer.create({
            data: {
              externalPersonId: currentId,
              personId: person.id,
              source: 'DENTALGO',
              assigneeId,
              journeyId: campaignId,
              joinedJourneyAt: joinedCampaignAt,
              stage: 'novo_cadastro',
              pipelineId: targetPipelineId,
            }
          });
        } else {
          console.warn(`[AssignCampaignLeads] Customer ID ${currentId} não encontrado no banco.`);
          continue;
        }
      }

      // Upsert Opportunity
      if (targetPipelineId) {
        let opp = await prisma.opportunity.findFirst({
          where: { customerId: customer.id, pipelineId: targetPipelineId, status: 'OPEN' }
        });

        if (!opp) {
          opp = await prisma.opportunity.create({
            data: {
              customerId: customer.id,
              pipelineId: targetPipelineId,
              stage: 'novo_cadastro',
              assigneeId,
              sourceCampaignId: campaignId
            }
          });
          DomainEventService.publish({
            type: DomainEventType.OPPORTUNITY_CREATED,
            personId: customer.personId,
            customerId: customer.id,
            opportunityId: opp.id,
            campaignId: campaignId,
            actorType: ActorType.SYSTEM,
            metadata: { pipelineId: targetPipelineId }
          });
        } else {
          // Fechar historico antigo se o assignee mudou
          if (opp.assigneeId !== assigneeId) {
            await prisma.leadAssignmentHistory.updateMany({
              where: { opportunityId: opp.id, assigneeId: opp.assigneeId, releasedAt: null },
              data: { releasedAt: new Date(), reason: 'MANUAL_TRANSFER' }
            });
          }
          opp = await prisma.opportunity.update({
            where: { id: opp.id },
            data: {
              stage: 'novo_cadastro',
              assigneeId,
              lastSignificantActivityAt: new Date()
            }
          });
        }

        // Criar registro de historico se há assignee
        if (assigneeId) {
          await prisma.leadAssignmentHistory.create({
            data: {
              opportunityId: opp.id,
              assigneeId,
              reason: 'INITIAL'
            }
          });

          // Dispara Domain Event de Assignment
          DomainEventService.publish({
            type: DomainEventType.CUSTOMER_ASSIGNED,
            personId: customer.personId,
            customerId: customer.id,
            opportunityId: opp.id,
            campaignId: campaignId,
            actorType: ActorType.SYSTEM,
            actorId: assigneeId,
            metadata: { reason: 'INITIAL' }
          });
        }
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

      results.push({
        customerId: customer.id,
        externalPersonId: customer.externalPersonId,
        assigneeId,
        joinedCampaignAt: joinedCampaignAt
      });
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

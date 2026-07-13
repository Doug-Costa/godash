import prisma from '../prisma';

export class AssignCampaignLeadsUseCase {
  async execute(externalPersonIds: number[], campaignId: string, userIds: string[], startDate?: string) {
    if (userIds.length === 0) {
      throw new Error('Pelo menos um operador deve ser selecionado para a distribuição da campanha.');
    }

    // 1. Buscar a jornada (incluindo as automações/passos do fluxo para pré-geração de alertas)
    const journey = await prisma.journey.findUnique({
      where: { id: campaignId },
      include: { automations: true }
    });

    if (!journey) {
      throw new Error('Campanha/Jornada não encontrada.');
    }

    const limitPerDay = journey.limitPerDay;
    const operatorCount = userIds.length;
    const results: { externalPersonId: number; assigneeId: string; joinedCampaignAt: Date }[] = [];

    // Contador de atribuições por operador para aplicar o limitador diário
    const operatorAssignments: Record<string, number> = {};
    for (const uid of userIds) {
      operatorAssignments[uid] = 0;
    }

    // Parse baseline date to local midnight to avoid timezone shifts
    let baseDate = new Date();
    if (startDate) {
      const parts = startDate.split('-');
      if (parts.length === 3) {
        baseDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 0, 0, 0, 0);
      }
    } else {
      baseDate.setHours(0, 0, 0, 0);
    }

    const now = new Date();

    for (let i = 0; i < externalPersonIds.length; i++) {
      const externalPersonId = externalPersonIds[i];
      const assigneeId = userIds[i % operatorCount];
      const countForAgent = operatorAssignments[assigneeId]++;

      // Calcular o joinedCampaignAt com base no limitPerDay e na data base de início
      const joinedCampaignAt = new Date(baseDate.getTime());
      if (limitPerDay && limitPerDay > 0) {
        const daysDelay = Math.floor(countForAgent / limitPerDay);
        joinedCampaignAt.setDate(joinedCampaignAt.getDate() + daysDelay);
      }

      // 2. Upsert do Customer para vincular ao operador, jornada e definir a data de entrada
      const customer = await prisma.customer.upsert({
        where: { externalPersonId },
        update: {
          assigneeId,
          journeyId: campaignId,
          joinedJourneyAt: joinedCampaignAt,
          stage: 'novo_cadastro', // Reinicia como "novo_cadastro" (Sem Contato) para o rodízio
          frozenUntil: null,      // Remove qualquer congelamento pré-existente
          freezeReason: null,
          lostReason: null,
        },
        create: {
          externalPersonId,
          assigneeId,
          journeyId: campaignId,
          joinedJourneyAt: joinedCampaignAt,
          stage: 'novo_cadastro',
        }
      });

      // 3. Excluir alertas pendentes anteriores para este customer
      await prisma.task.deleteMany({
        where: {
          customerId: customer.id,
          status: 'PENDING'
        }
      });

      // 4. Pré-gerar alertas de tarefas da jornada se a data agendada for agora ou no passado
      if (journey.automations && journey.automations.length > 0) {
        for (const automation of journey.automations) {
          const config = automation.actionConfig as any;
          const dayOffset = typeof config?.dayOffset === 'number' ? config.dayOffset : 0;
          const channel = config?.channel || 'WHATSAPP';

          const scheduledFor = new Date(joinedCampaignAt.getTime());
          scheduledFor.setDate(scheduledFor.getDate() + dayOffset);

          // Se a data de agendamento já passou ou é hoje, gera o alerta
          if (scheduledFor <= now) {
            await prisma.task.create({
              data: {
                customerId: customer.id,
                assignedToId: assigneeId,
                journeyId: journey.id,
                automationId: automation.id,
                scheduledFor,
                taskType: channel,
                status: 'PENDING'
              }
            });
          }
        }
      }

      results.push({ externalPersonId, assigneeId, joinedCampaignAt: joinedCampaignAt });
    }

    return results;
  }
}

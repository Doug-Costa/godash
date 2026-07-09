import prisma from '../prisma';

export class AssignCampaignLeadsUseCase {
  async execute(externalPersonIds: number[], campaignId: string, userIds: string[], startDate?: string) {
    if (userIds.length === 0) {
      throw new Error('Pelo menos um operador deve ser selecionado para a distribuição da campanha.');
    }

    // 1. Buscar a campanha (incluindo os passos do fluxo para pré-geração de alertas)
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { flowSteps: true }
    });

    if (!campaign) {
      throw new Error('Campanha não encontrada.');
    }

    const limitPerDay = campaign.limitPerDay;
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

      // 2. Upsert do LeadState para vincular ao operador, campanha e definir a data de entrada
      const leadState = await prisma.leadState.upsert({
        where: { externalPersonId },
        update: {
          assigneeId,
          campaignId,
          joinedCampaignAt,
          stage: 'novo_cadastro', // Reinicia como "novo_cadastro" (Sem Contato) para o rodízio
          frozenUntil: null,      // Remove qualquer congelamento pré-existente
          freezeReason: null,
          lostReason: null,
        },
        create: {
          externalPersonId,
          assigneeId,
          campaignId,
          joinedCampaignAt,
          stage: 'novo_cadastro',
        }
      });

      // 3. Excluir alertas pendentes anteriores para este lead
      await prisma.taskAlert.deleteMany({
        where: {
          leadStateId: leadState.id,
          status: 'PENDING'
        }
      });

      // 4. Pré-gerar alertas de tarefas da campanha se a data agendada for agora ou no passado
      if (campaign.flowSteps && campaign.flowSteps.length > 0) {
        for (const step of campaign.flowSteps) {
          const scheduledFor = new Date(joinedCampaignAt.getTime());
          scheduledFor.setDate(scheduledFor.getDate() + step.dayOffset);

          // Se a data de agendamento já passou ou é hoje, gera o alerta
          if (scheduledFor <= now) {
            await prisma.taskAlert.create({
              data: {
                leadStateId: leadState.id,
                assignedToId: assigneeId,
                stepId: step.id,
                scheduledFor,
                taskType: step.channel,
                status: 'PENDING'
              }
            });
          }
        }
      }

      results.push({ externalPersonId, assigneeId, joinedCampaignAt });
    }

    return results;
  }
}

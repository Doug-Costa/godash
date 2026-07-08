import prisma from '../prisma';

export class AssignCampaignLeadsUseCase {
  async execute(externalPersonIds: number[], campaignId: string, userIds: string[]) {
    if (userIds.length === 0) {
      throw new Error('Pelo menos um operador deve ser selecionado para a distribuição da campanha.');
    }

    // 1. Buscar a campanha
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
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

    for (let i = 0; i < externalPersonIds.length; i++) {
      const externalPersonId = externalPersonIds[i];
      const assigneeId = userIds[i % operatorCount];
      const countForAgent = operatorAssignments[assigneeId]++;

      // Calcular o joinedCampaignAt com base no limitPerDay
      const joinedCampaignAt = new Date();
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

      results.push({ externalPersonId, assigneeId, joinedCampaignAt });
    }

    return results;
  }
}

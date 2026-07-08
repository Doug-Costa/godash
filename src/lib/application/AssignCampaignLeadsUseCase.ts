import prisma from '../prisma';

export class AssignCampaignLeadsUseCase {
  async execute(externalPersonIds: number[], campaignId: string, userIds: string[]) {
    if (userIds.length === 0) {
      throw new Error('Pelo menos um operador deve ser selecionado para a distribuição da campanha.');
    }

    // 1. Buscar a campanha e seus passos do fluxo
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { flowSteps: true }
    });

    if (!campaign) {
      throw new Error('Campanha não encontrada.');
    }

    const operatorCount = userIds.length;
    const now = new Date();
    const results: { externalPersonId: number; assigneeId: string }[] = [];

    for (let i = 0; i < externalPersonIds.length; i++) {
      const externalPersonId = externalPersonIds[i];
      const assigneeId = userIds[i % operatorCount];

      // 2. Upsert do LeadState para vincular ao operador e campanha
      const leadState = await prisma.leadState.upsert({
        where: { externalPersonId },
        update: {
          assigneeId,
          campaignId,
          stage: 'novo_cadastro', // Reinicia como "novo_cadastro" (Sem Contato) para o rodízio
          frozenUntil: null,      // Remove qualquer congelamento pré-existente
          freezeReason: null,
          lostReason: null,
        },
        create: {
          externalPersonId,
          assigneeId,
          campaignId,
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

      // 4. Criar os novos TaskAlerts para cada passo do fluxo
      for (const step of campaign.flowSteps) {
        const scheduledFor = new Date();
        scheduledFor.setDate(now.getDate() + step.dayOffset);

        await prisma.taskAlert.create({
          data: {
            leadStateId: leadState.id,
            assignedToId: assigneeId,
            stepId: step.id,
            scheduledFor,
            taskType: step.channel, // "WHATSAPP" | "EMAIL" | "CALL"
            status: 'PENDING',
          }
        });
      }

      results.push({ externalPersonId, assigneeId });
    }

    return results;
  }
}

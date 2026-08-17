import prisma from '../prisma';
import { RoutingEngineService } from './RoutingEngineService';
import { CrmEventDispatcher } from '../domain/crm.events';

export class LeadRotationService {
  /**
   * Varre todas as campanhas que têm rotação habilitada e aplica o round-robin nos leads expirados.
   */
  async processRotations(): Promise<number> {
    const campaignsWithRotation = await prisma.journey.findMany({
      where: { rotationEnabled: true }
    });

    let totalRotated = 0;
    const routingEngine = new RoutingEngineService();

    for (const campaign of campaignsWithRotation) {
      // Data limite: agora - X dias
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - campaign.rotationInactivityDays);

      // Buscar oportunidades abertas desta campanha, atribuídas a um agente, 
      // e sem atividade significativa há mais de X dias, não congeladas.
      const expiredOps = await prisma.opportunity.findMany({
        where: {
          customer: { journeyId: campaign.id },
          status: 'OPEN',
          assigneeId: { not: null },
          lastSignificantActivityAt: { lte: thresholdDate },
          OR: [
            { freezeUntil: null },
            { freezeUntil: { lte: new Date() } }
          ]
        },
        include: {
          customer: true
        }
      });

      for (const op of expiredOps) {
        const previousAssigneeId = op.assigneeId!;
        
        // 1. Fechar histórico atual
        await prisma.leadAssignmentHistory.updateMany({
          where: {
            opportunityId: op.id,
            assigneeId: previousAssigneeId,
            releasedAt: null
          },
          data: {
            releasedAt: new Date(),
            reason: 'SLA_EXPIRED'
          }
        });

        // 2. Definir o novo assigner ignorando o previousAssigneeId
        // Busca os usuários disponíveis da campanha ignorando o previousAssigneeId
        const activeUsers = await prisma.user.findMany({
          where: { isActive: true, role: 'AGENT', id: { not: previousAssigneeId } },
          select: { id: true }
        });
        
        const candidateUserIds = activeUsers.map(u => u.id);

        const newAssigneeId = await routingEngine.determineAssignee(
          op.customerId,
          {
            routingMode: 'ROUND_ROBIN', // Forçamos round-robin para ignorar AccountManager loop
            useAccountManager: false,
            strictSkillMatch: campaign.strictSkillMatch,
            productId: campaign.productId
          },
          'AGENT',
          undefined, // não temos um index perfeito aqui, fallback para aleatório ou último uso
          candidateUserIds
        );

        if (!newAssigneeId) {
          // Se não achar substituto, envia para a vala comum (POOL)
          await this.orphanOpportunity(op.id, previousAssigneeId);
        } else {
          // 3. Reatribuir e abrir novo histórico
          await prisma.opportunity.update({
            where: { id: op.id },
            data: { 
              assigneeId: newAssigneeId,
              lastSignificantActivityAt: new Date(), // reseta o relógio
            }
          });

          await prisma.customer.update({
            where: { id: op.customerId },
            data: { assigneeId: newAssigneeId }
          });

          await prisma.leadAssignmentHistory.create({
            data: {
              opportunityId: op.id,
              assigneeId: newAssigneeId,
              reason: 'ROTATED_DUE_TO_INACTIVITY'
            }
          });

          // Notificar timeline
          const systemUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
          if (systemUser) {
            await prisma.interaction.create({
              data: {
                customerId: op.customerId,
                opportunityId: op.id,
                authorId: systemUser.id,
                text: `Lead redistribuído automaticamente devido a inatividade no SLA (${campaign.rotationInactivityDays} dias).`,
                type: 'SYSTEM_ROTATION'
              }
            });
          }
        }

        totalRotated++;
      }
    }

    return totalRotated;
  }

  private async orphanOpportunity(opportunityId: string, previousAssigneeId: string) {
    await prisma.opportunity.update({
      where: { id: opportunityId },
      data: { assigneeId: null }
    });

    const op = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
    if (op) {
      await prisma.customer.update({
        where: { id: op.customerId },
        data: { assigneeId: null }
      });
    }

    await prisma.leadAssignmentHistory.create({
      data: {
        opportunityId,
        assigneeId: null,
        reason: 'ROTATED_ORPHANED_NO_ELIGIBLE_AGENTS'
      }
    });
  }
}

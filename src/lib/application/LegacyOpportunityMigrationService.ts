import prisma from '@/lib/prisma';

export type LegacyRestoreResult = {
  users: Array<{ id: string; name: string }>;
  scanned: number;
  created: number;
  assignedExisting: number;
  alreadyCanonical: number;
  missingPipeline: number;
  closedOpportunityConflict: number;
  assigneeConflict: number;
  conflicts: Array<{ customerId: string; reason: string }>;
  apply: boolean;
};

const normalize = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

export class LegacyOpportunityMigrationService {
  static async restoreForAgentNames(agentNames: string[], apply = false): Promise<LegacyRestoreResult> {
    const wanted = [...new Set(agentNames.map(normalize))];
    const allUsers = await prisma.user.findMany({ select: { id: true, name: true } });
    const users = wanted.map(requestedName => {
      const matches = allUsers.filter(user => normalize(user.name || '').includes(requestedName));
      if (matches.length !== 1) {
        throw new Error(matches.length
          ? `Nome ambíguo para operador: ${requestedName}`
          : `Operador não encontrado: ${requestedName}`);
      }
      return matches[0];
    });

    const result: LegacyRestoreResult = {
      users: users.map(user => ({ id: user.id, name: user.name || 'Sem nome' })),
      scanned: 0,
      created: 0,
      assignedExisting: 0,
      alreadyCanonical: 0,
      missingPipeline: 0,
      closedOpportunityConflict: 0,
      assigneeConflict: 0,
      conflicts: [],
      apply
    };

    for (const user of users) {
      const customers = await prisma.customer.findMany({
        where: { assigneeId: user.id, tag: { not: 'DISCARDED' } },
        include: { journey: { select: { pipelineId: true } }, opportunities: true }
      });
      result.scanned += customers.length;

      for (const customer of customers) {
        const targetPipelineId = customer.pipelineId || customer.journey?.pipelineId || null;
        if (!targetPipelineId) {
          result.missingPipeline++;
          result.conflicts.push({ customerId: customer.id, reason: 'SEM_FUNIL_LEGADO' });
          continue;
        }

        const open = customer.opportunities.find(opportunity =>
          opportunity.pipelineId === targetPipelineId && opportunity.status === 'OPEN'
        );
        if (open) {
          if (open.assigneeId === user.id) {
            result.alreadyCanonical++;
          } else if (!open.assigneeId) {
            result.assignedExisting++;
            if (apply) {
              await prisma.opportunity.update({
                where: { id: open.id },
                data: { assigneeId: user.id, lastSignificantActivityAt: customer.lastInteractionAt || customer.updatedAt }
              });
            }
          } else {
            result.assigneeConflict++;
            result.conflicts.push({ customerId: customer.id, reason: `RESPONSAVEL_DIVERGENTE:${open.assigneeId}` });
          }
          continue;
        }

        const closed = customer.opportunities.some(opportunity => opportunity.pipelineId === targetPipelineId);
        if (closed) {
          result.closedOpportunityConflict++;
          result.conflicts.push({ customerId: customer.id, reason: 'OPORTUNIDADE_ENCERRADA_NO_MESMO_FUNIL' });
          continue;
        }

        result.created++;
        if (apply) {
          await prisma.opportunity.create({
            data: {
              customerId: customer.id,
              pipelineId: targetPipelineId,
              stage: customer.stage || 'novo_cadastro',
              status: 'OPEN',
              assigneeId: user.id,
              lastSignificantActivityAt: customer.lastInteractionAt || customer.updatedAt,
              metadata: {
                migratedFromLegacyCustomer: true,
                migratedAt: new Date().toISOString(),
                preservedLegacyJourneyId: customer.journeyId || null
              }
            }
          });
        }
      }
    }

    return result;
  }
}

/**
 * Desfaz uma junção de Persons feita por IdentityMatchingService.mergePersons,
 * usando o registro gravado em MergeEvent.metadata (version 2).
 *
 * - preview(): executa o desfazer dentro de uma transação e a CANCELA no fim —
 *   o relatório mostra exatamente o que aconteceria, sem gravar nada.
 * - undo(): mesma operação, gravando. Exige motivo.
 *
 * Auditoria: a junção original NÃO é apagada; recebe `undone` (quem, quando, por quê)
 * no metadata, e um DomainEvent IDENTITY_MERGE_UNDONE registra o relatório. A revisão
 * que originou a junção volta para a fila (PENDING) para ser decidida de novo.
 *
 * O que não volta (e o relatório diz): registros criados na ficha que ficou DEPOIS da
 * junção — não há como saber de qual das duas pessoas eles eram.
 */
import { Prisma } from '@prisma/client';
import prisma from '../prisma';

export interface UndoReport {
  mergeEventId: string;
  restoredPersonId: string;
  restoredPersonName: string | null;
  targetPersonId: string;
  aliasesRestored: number;
  aliasesMissing: number;
  customersRepointed: number;
  customersRecreated: number;
  rowsRestored: Record<string, number>;
  campaignRowsRecreated: number;
  campaignRowsSkipped: number;
  domainEventsRestored: number;
  reviewReopened: string | null;
  canonicalFieldsRestored: string[];
  warnings: string[];
}

class PreviewRollback extends Error {
  constructor(public readonly report: UndoReport) {
    super('preview');
  }
}

/** Campos de Person que podem ser recriados a partir do snapshot. */
const PERSON_FIELDS = [
  'id', 'fullName', 'email', 'secondaryEmail', 'phoneNumber', 'secondaryPhone', 'cpf', 'source',
  'externalPersonId', 'accountManagerId', 'accountManagerActive', 'createdAt', 'updatedAt',
] as const;

const pick = (row: Record<string, any>, fields: readonly string[]) =>
  Object.fromEntries(fields.filter(f => f in row).map(f => [f, row[f]]));

/**
 * Cópia do snapshot de uma linha para recriá-la. Os snapshots são linhas simples
 * (sem relações aninhadas) — campos JSON como Customer.metadata e
 * CampaignEnrollment.attribution são preservados como estavam.
 */
const rowData = (row: Record<string, any>) => ({ ...row });

export class MergeUndoService {
  static async preview(mergeEventId: string): Promise<UndoReport> {
    try {
      await this.run(mergeEventId, { dryRun: true });
      throw new Error('A prévia deveria ter sido cancelada.');
    } catch (err) {
      if (err instanceof PreviewRollback) return err.report;
      throw err;
    }
  }

  static async undo(mergeEventId: string, undoneById: string | null, reason: string): Promise<UndoReport> {
    if (!reason || reason.trim().length < 5) {
      throw new Error('Informe o motivo do desfazer (mínimo 5 caracteres).');
    }
    return this.run(mergeEventId, { dryRun: false, undoneById, reason: reason.trim() });
  }

  private static async run(
    mergeEventId: string,
    opts: { dryRun: boolean; undoneById?: string | null; reason?: string },
  ): Promise<UndoReport> {
    return prisma.$transaction(async (tx) => {
      const event = await tx.mergeEvent.findUnique({ where: { id: mergeEventId } });
      if (!event) throw new Error('Junção não encontrada.');
      const meta = (event.metadata ?? {}) as any;
      if (meta.version !== 2) {
        throw new Error('Esta junção é anterior ao registro completo e não pode ser desfeita automaticamente.');
      }
      if (meta.undone) throw new Error(`Esta junção já foi desfeita em ${new Date(meta.undone.at).toLocaleString('pt-BR')}.`);

      const sourceId: string = event.sourcePersonId;
      const targetId: string = event.targetPersonId;

      if (!(await tx.person.findUnique({ where: { id: targetId }, select: { id: true } }))) {
        throw new Error('A ficha que ficou na junção não existe mais (provavelmente foi unida a outra). Desfaça primeiro a junção mais recente.');
      }
      if (await tx.person.findUnique({ where: { id: sourceId }, select: { id: true } })) {
        throw new Error('A ficha absorvida já existe de novo — nada a desfazer.');
      }
      const later = await tx.mergeEvent.findMany({
        where: { sourcePersonId: targetId, timestamp: { gt: event.timestamp } },
        select: { id: true, metadata: true },
      });
      if (later.some(l => !(l.metadata as any)?.undone)) {
        throw new Error('A ficha que ficou foi unida a outra depois desta junção. Desfaça primeiro a junção mais recente.');
      }

      const warnings: string[] = [];

      // 1. Recria a Person absorvida com o mesmo id
      const personData: Record<string, any> = pick(meta.sourcePerson, PERSON_FIELDS);
      if (personData.accountManagerId
        && !(await tx.user.findUnique({ where: { id: personData.accountManagerId }, select: { id: true } }))) {
        personData.accountManagerId = null;
        warnings.push('O account manager da ficha absorvida não existe mais; ficou sem account manager.');
      }
      await tx.person.create({ data: personData as Prisma.PersonUncheckedCreateInput });

      // 2. Aliases voltam (só os que ainda estão na ficha que ficou)
      const aliasIds: string[] = meta.movedAliasIds ?? [];
      const aliases = await tx.identityAlias.updateMany({
        where: { id: { in: aliasIds }, personId: targetId },
        data: { personId: sourceId },
      });
      if (aliases.count < aliasIds.length) {
        warnings.push(`${aliasIds.length - aliases.count} registro(s) de origem não estavam mais na ficha que ficou e não voltaram.`);
      }

      // 3. Customers que só mudaram de dono
      const repointed = await tx.customer.updateMany({
        where: { id: { in: meta.repointedCustomerIds ?? [] }, personId: targetId },
        data: { personId: sourceId },
      });

      // 4. Customers removidos por conflito de jornada: recriar e devolver o que foi movido
      const rowsRestored: Record<string, number> = {};
      let customersRecreated = 0;
      let campaignRowsRecreated = 0;
      let campaignRowsSkipped = 0;
      for (const mc of meta.mergedCustomers ?? []) {
        const cust = rowData(mc.sourceCustomer);
        await tx.customer.create({ data: { ...cust, personId: sourceId } as Prisma.CustomerUncheckedCreateInput });
        customersRecreated++;

        const from = { customerId: mc.intoCustomerId };
        const to = { customerId: cust.id as string };
        const back = async (name: string, ids: string[], update: (where: any) => Promise<{ count: number }>) => {
          if (!ids?.length) return;
          rowsRestored[name] = (rowsRestored[name] || 0) + (await update({ id: { in: ids }, ...from })).count;
        };
        await back('interações', mc.moved.interaction, w => tx.interaction.updateMany({ where: w, data: to }));
        await back('tarefas', mc.moved.task, w => tx.task.updateMany({ where: w, data: to }));
        await back('oportunidades', mc.moved.opportunity, w => tx.opportunity.updateMany({ where: w, data: to }));
        await back('produtos', mc.moved.customerProduct, w => tx.customerProduct.updateMany({ where: w, data: to }));
        await back('execuções de fluxo', mc.moved.flowExecution, w => tx.flowExecution.updateMany({ where: w, data: to }));
        await back('eventos', mc.moved.domainEvent, w => tx.domainEvent.updateMany({ where: w, data: to }));
        await back('audiência de campanha', mc.moved.campaignAudienceMember, w => tx.campaignAudienceMember.updateMany({ where: w, data: to }));
        await back('matrículas de campanha', mc.moved.campaignEnrollment, w => tx.campaignEnrollment.updateMany({ where: w, data: to }));

        // Linhas removidas por colisão (mesma campanha nos dois lados) são recriadas
        for (const row of [...(mc.droppedAudience ?? []), ...(mc.droppedEnrollments ?? [])]) {
          const campaignExists = await tx.campaign.findUnique({ where: { id: row.campaignId }, select: { id: true } });
          if (!campaignExists) {
            campaignRowsSkipped++;
            continue;
          }
          const data: Record<string, any> = { ...rowData(row), customerId: cust.id };
          if ('isTest' in row) {
            // Matrícula: a execução de fluxo só é religada se não estiver em uso por outra matrícula
            if (data.flowExecutionId
              && await tx.campaignEnrollment.findFirst({ where: { flowExecutionId: data.flowExecutionId }, select: { id: true } })) {
              data.flowExecutionId = null;
            }
            await tx.campaignEnrollment.create({ data: data as Prisma.CampaignEnrollmentUncheckedCreateInput });
          } else {
            await tx.campaignAudienceMember.create({ data: data as Prisma.CampaignAudienceMemberUncheckedCreateInput });
          }
          campaignRowsRecreated++;
        }
      }
      if (campaignRowsSkipped) warnings.push(`${campaignRowsSkipped} participação(ões) em campanhas que foram apagadas não puderam ser recriadas.`);

      // 5. Referências soltas
      const events = await tx.domainEvent.updateMany({
        where: { id: { in: meta.domainEventIdsRepointed ?? [] }, personId: targetId },
        data: { personId: sourceId },
      });
      await tx.identityReview.updateMany({
        where: { id: { in: meta.reviewIdsRepointed ?? [] }, candidatePersonId: targetId },
        data: { candidatePersonId: sourceId },
      });

      // 6. Dados canônicos sobrescritos na junção: volta só o que ninguém mudou depois
      const canonicalFieldsRestored: string[] = [];
      const applied: Record<string, string | null> = meta.canonicalOverridesApplied ?? {};
      if (Object.keys(applied).length > 0) {
        const target = await tx.person.findUniqueOrThrow({ where: { id: targetId } });
        const restore: Record<string, string | null> = {};
        for (const [field, value] of Object.entries(applied)) {
          if ((target as any)[field] === value) {
            restore[field] = meta.targetBefore?.[field] ?? null;
            canonicalFieldsRestored.push(field);
          } else {
            warnings.push(`O campo "${field}" da ficha que ficou foi alterado depois da junção e não foi restaurado.`);
          }
        }
        if (canonicalFieldsRestored.length) await tx.person.update({ where: { id: targetId }, data: restore });
      }

      // 7. A revisão que originou a junção volta para a fila
      let reviewReopened: string | null = null;
      if (meta.reviewId) {
        const reopened = await tx.identityReview.updateMany({
          where: { id: meta.reviewId, status: 'PROCESSED', decision: 'LINK' },
          data: { status: 'PENDING', decision: null, reviewedById: null, reviewedAt: null },
        });
        if (reopened.count) reviewReopened = meta.reviewId;
      }

      warnings.push('Registros criados na ficha que ficou depois da junção continuam nela.');

      const report: UndoReport = {
        mergeEventId,
        restoredPersonId: sourceId,
        restoredPersonName: meta.sourcePerson?.fullName ?? null,
        targetPersonId: targetId,
        aliasesRestored: aliases.count,
        aliasesMissing: aliasIds.length - aliases.count,
        customersRepointed: repointed.count,
        customersRecreated,
        rowsRestored,
        campaignRowsRecreated,
        campaignRowsSkipped,
        domainEventsRestored: events.count,
        reviewReopened,
        canonicalFieldsRestored,
        warnings,
      };

      if (opts.dryRun) throw new PreviewRollback(report);

      // 8. Auditoria: a junção original é marcada (não apagada) e o desfazer vira um evento
      const undone = { at: new Date().toISOString(), byUserId: opts.undoneById ?? null, reason: opts.reason };
      await tx.mergeEvent.update({ where: { id: mergeEventId }, data: { metadata: { ...meta, undone } } });
      await tx.domainEvent.create({
        data: {
          type: 'IDENTITY_MERGE_UNDONE',
          personId: sourceId,
          actorType: 'USER',
          actorId: opts.undoneById ?? null,
          correlationId: mergeEventId,
          metadata: JSON.parse(JSON.stringify({ reason: opts.reason, report })),
        },
      });

      console.log(`[MergeUndoService] Junção ${mergeEventId} desfeita: Person ${sourceId} restaurada (separada de ${targetId})`);
      return report;
    }, { maxWait: 15000, timeout: 60000 });
  }
}

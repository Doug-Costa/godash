/**
 * load-identity-review-queue.ts
 *
 * Carrega na fila de revisão (IdentityReview) o que as auditorias de identidade
 * encontraram: junções sugeridas, pares de dúvida e suspeitas de ficha misturada.
 * Regras em src/lib/identity/reviewQueue.ts.
 *
 * NÃO junta nem separa fichas. Só cria revisões pendentes; a decisão é do admin na tela.
 * Pode rodar de novo: revisões já criadas (em qualquer status) não são duplicadas.
 *
 * Uso:
 *   npx tsx prisma/load-identity-review-queue.ts            # SIMULAÇÃO — não grava nada
 *   npx tsx prisma/load-identity-review-queue.ts --apply    # grava as revisões
 *   docker exec -it dentalgo-bi npx tsx prisma/load-identity-review-queue.ts [--apply]
 */

import { PrismaClient } from '@prisma/client';
import { loadAuditPersons } from '../src/lib/identity/identityAudit';
import { AUDIT_REVIEW_SOURCE, buildReviewQueue, isBatchable, type AuditReviewKind } from '../src/lib/identity/reviewQueue';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

const LABELS: Record<AuditReviewKind, string> = {
  MERGE_SUGGESTED: 'Junção sugerida (mesmo e-mail + nome compatível)',
  PAIR_REVIEW: 'Par de dúvida (revisão humana)',
  MIXED_SUSPECT: 'Suspeita de ficha misturada (inspeção)',
};

async function main() {
  const persons = await loadAuditPersons(prisma);
  const items = buildReviewQueue(persons);

  const existing = new Set(
    (await prisma.identityReview.findMany({
      where: { incomingSource: AUDIT_REVIEW_SOURCE },
      select: { incomingExternalId: true },
    })).map(r => r.incomingExternalId),
  );
  const toCreate = items.filter(i => !existing.has(i.incomingExternalId));

  console.log(`\n═══ Carga da fila de revisão — ${APPLY ? 'GRAVANDO' : 'SIMULAÇÃO (nada será gravado)'} ═══`);
  console.log(`Persons analisadas: ${persons.length}\n`);
  for (const kind of Object.keys(LABELS) as AuditReviewKind[]) {
    const all = items.filter(i => i.kind === kind);
    const fresh = toCreate.filter(i => i.kind === kind);
    const batch = fresh.filter(i => isBatchable(i.evidences)).length;
    console.log(`${LABELS[kind]}`);
    console.log(`   encontradas: ${String(all.length).padStart(5)} | já na fila: ${String(all.length - fresh.length).padStart(5)} | novas: ${String(fresh.length).padStart(5)} | aprováveis em lote: ${batch}`);
  }

  if (!APPLY) {
    console.log('\nSimulação concluída. Para gravar, rode de novo com --apply.');
    return;
  }

  const CHUNK = 200;
  for (let i = 0; i < toCreate.length; i += CHUNK) {
    await prisma.identityReview.createMany({
      data: toCreate.slice(i, i + CHUNK).map(item => ({
        incomingSource: AUDIT_REVIEW_SOURCE,
        incomingExternalId: item.incomingExternalId,
        candidatePersonId: item.candidatePersonId,
        confidenceScore: item.confidenceScore,
        evidences: item.evidences,
        status: 'PENDING',
      })),
    });
  }
  console.log(`\n✔ ${toCreate.length} revisões criadas. Nenhuma ficha foi juntada ou separada.`);
}

main()
  .catch(err => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

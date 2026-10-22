/**
 * audit-identity-duplicates.ts
 *
 * Mede quantas Persons provavelmente são a mesma pessoa, aplicando as regras de
 * src/lib/identity/matchRules.ts sobre toda a base do CRM (Postgres).
 * Cálculo em src/lib/identity/identityAudit.ts (o mesmo usado na carga da fila de revisão).
 *
 * SOMENTE LEITURA — não altera nada no banco.
 * Saída: resumo no terminal (só contagens) + CSV de pares em scratch/ com IDs
 * (sem nome, e-mail ou telefone).
 *
 * Uso:
 *   npx tsx prisma/audit-identity-duplicates.ts
 *   docker exec -it dentalgo-bi npx tsx prisma/audit-identity-duplicates.ts
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { findDuplicatePairs, loadAuditPersons } from '../src/lib/identity/identityAudit';
import { normalizeCpf } from '../src/lib/identity/matchRules';

const prisma = new PrismaClient();

async function main() {
  const persons = await loadAuditPersons(prisma);
  const { pairs, mergeClusters, skippedBigBlocks } = findDuplicatePairs(persons);
  for (const block of skippedBigBlocks) console.warn(`  ⚠ bloco ignorado por tamanho: ${block}`);

  const removableDuplicates = mergeClusters.reduce((sum, c) => sum + c.length - 1, 0);
  const autoPairs = pairs.filter(p => p.result.decision === 'AUTO_MERGE');
  const reviewPairs = pairs.filter(p => p.result.decision === 'REVIEW');
  const reviewByReason = new Map<string, number>();
  for (const p of reviewPairs) reviewByReason.set(p.result.reason, (reviewByReason.get(p.result.reason) || 0) + 1);

  const pendingReviews = await prisma.identityReview.count({ where: { status: 'PENDING' } });
  const withCpf = persons.filter(p => normalizeCpf(p.cpf)).length;

  // ── Relatório ────────────────────────────────────────────────────────────
  const pct = (n: number) => (persons.length ? ((n / persons.length) * 100).toFixed(1) : '0.0');
  console.log('\n═══ Auditoria de identidade (somente leitura) ═══');
  console.log(`Persons na base:                         ${persons.length}`);
  console.log(`  com CPF válido:                        ${withCpf} (${pct(withCpf)}%)`);
  console.log(`\nJUNÇÃO AUTOMÁTICA (e-mail igual + nome compatível)`);
  console.log(`  pares:                                 ${autoPairs.length}`);
  console.log(`  grupos de mesma pessoa:                ${mergeClusters.length}`);
  console.log(`  fichas duplicadas que sumiriam:        ${removableDuplicates} (${pct(removableDuplicates)}% da base)`);
  console.log(`\nREVISÃO HUMANA`);
  console.log(`  pares:                                 ${reviewPairs.length}`);
  for (const [reason, n] of [...reviewByReason].sort((x, y) => y[1] - x[1])) {
    console.log(`    ${String(n).padStart(6)}  ${reason}`);
  }
  console.log(`\nFila de revisão atual (PENDING):         ${pendingReviews}`);
  if (skippedBigBlocks.length) console.log(`Blocos ignorados por tamanho:            ${skippedBigBlocks.length}`);

  // ── Detalhe (só IDs) ─────────────────────────────────────────────────────
  const fileName = `audit-identity-${new Date().toISOString().slice(0, 10)}.csv`;
  let outFile = path.join(path.resolve(__dirname, '..', 'scratch'), fileName);
  try {
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.accessSync(path.dirname(outFile), fs.constants.W_OK);
  } catch {
    outFile = path.join(os.tmpdir(), fileName); // ex.: dentro do container sem permissão em /app/scratch
  }
  const lines = ['decisao,personA,fonteA,personB,fonteB,evidencias,bloqueios,motivo'];
  for (const p of pairs) {
    lines.push([
      p.result.decision, p.a.id, p.a.source, p.b.id, p.b.source,
      p.result.evidences.join('|'), p.result.blockers.join('|'), `"${p.result.reason}"`,
    ].join(','));
  }
  fs.writeFileSync(outFile, lines.join('\n'), 'utf-8');
  console.log(`\nDetalhe por par (só IDs): ${path.relative(process.cwd(), outFile)}`);
}

main()
  .catch(err => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

/**
 * audit-identity-duplicates.ts
 *
 * Mede quantas Persons provavelmente são a mesma pessoa, aplicando as regras de
 * src/lib/identity/matchRules.ts sobre toda a base do CRM (Postgres).
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
import {
  matchIdentities,
  nameTokens,
  normalizeCpf,
  normalizeEmail,
  normalizePhone,
  type IdentitySignals,
  type MatchResult,
} from '../src/lib/identity/matchRules';

const prisma = new PrismaClient();

interface Row {
  id: string;
  source: string;
  signals: IdentitySignals;
}

function addToBlock(blocks: Map<string, Set<number>>, key: string | null, index: number) {
  if (!key) return;
  let set = blocks.get(key);
  if (!set) blocks.set(key, (set = new Set()));
  set.add(index);
}

class UnionFind {
  private parent: number[];
  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
  }
  find(x: number): number {
    while (this.parent[x] !== x) x = this.parent[x] = this.parent[this.parent[x]];
    return x;
  }
  union(a: number, b: number) {
    this.parent[this.find(a)] = this.find(b);
  }
}

async function main() {
  const persons = await prisma.person.findMany({
    select: {
      id: true, source: true, fullName: true, email: true, secondaryEmail: true,
      phoneNumber: true, secondaryPhone: true, cpf: true,
      identityAliases: { select: { email: true, phone: true, name: true } },
    },
  });

  const rows: Row[] = persons.map(p => ({
    id: p.id,
    source: p.source,
    signals: {
      names: [p.fullName, ...p.identityAliases.map(a => a.name)].filter((n): n is string => !!n),
      emails: [p.email, p.secondaryEmail, ...p.identityAliases.map(a => a.email)].filter((e): e is string => !!e),
      phones: [p.phoneNumber, p.secondaryPhone, ...p.identityAliases.map(a => a.phone)].filter((t): t is string => !!t),
      cpf: p.cpf,
    },
  }));

  // ── Blocagem: só compara fichas que compartilham alguma chave ─────────────
  const blocks = new Map<string, Set<number>>();
  rows.forEach((row, i) => {
    for (const e of row.signals.emails) {
      const email = normalizeEmail(e);
      addToBlock(blocks, email && `email:${email}`, i);
      // E-mail com erro de digitação: mesmo domínio + mesmo primeiro nome
      const first = row.signals.names.map(nameTokens).find(t => t.length > 0)?.[0];
      if (email && first && first.length >= 2) addToBlock(blocks, `near:${email.split('@')[1]}:${first}`, i);
    }
    for (const t of row.signals.phones) {
      const phone = normalizePhone(t);
      addToBlock(blocks, phone && `phone:${phone}`, i);
    }
    const cpf = normalizeCpf(row.signals.cpf);
    addToBlock(blocks, cpf && `cpf:${cpf}`, i);
  });

  const compared = new Set<string>();
  const pairs: { a: number; b: number; result: MatchResult }[] = [];
  let skippedBigBlocks = 0;

  for (const [key, members] of blocks) {
    const list = [...members];
    if (list.length < 2) continue;
    // Bloco gigante (ex.: e-mail genérico usado por centenas) — registra e não explode em N².
    if (list.length > 400) {
      skippedBigBlocks++;
      console.warn(`  ⚠ bloco ignorado por tamanho (${list.length} fichas): ${key.split(':')[0]}`);
      continue;
    }
    for (let x = 0; x < list.length; x++) {
      for (let y = x + 1; y < list.length; y++) {
        const a = Math.min(list[x], list[y]);
        const b = Math.max(list[x], list[y]);
        const pairKey = `${a}:${b}`;
        if (compared.has(pairKey)) continue;
        compared.add(pairKey);
        const result = matchIdentities(rows[a].signals, rows[b].signals);
        if (result.decision !== 'DISTINCT') pairs.push({ a, b, result });
      }
    }
  }

  // ── Agrupamento das junções automáticas ─────────────────────────────────
  const uf = new UnionFind(rows.length);
  for (const p of pairs) if (p.result.decision === 'AUTO_MERGE') uf.union(p.a, p.b);
  const clusterSizes = new Map<number, number>();
  rows.forEach((_, i) => {
    const root = uf.find(i);
    clusterSizes.set(root, (clusterSizes.get(root) || 0) + 1);
  });
  const mergeClusters = [...clusterSizes.values()].filter(n => n > 1);
  const removableDuplicates = mergeClusters.reduce((sum, n) => sum + n - 1, 0);

  const autoPairs = pairs.filter(p => p.result.decision === 'AUTO_MERGE');
  const reviewPairs = pairs.filter(p => p.result.decision === 'REVIEW');
  const reviewByReason = new Map<string, number>();
  for (const p of reviewPairs) reviewByReason.set(p.result.reason, (reviewByReason.get(p.result.reason) || 0) + 1);

  const pendingReviews = await prisma.identityReview.count({ where: { status: 'PENDING' } });
  const withCpf = rows.filter(r => normalizeCpf(r.signals.cpf)).length;

  // ── Relatório ────────────────────────────────────────────────────────────
  const pct = (n: number) => (rows.length ? ((n / rows.length) * 100).toFixed(1) : '0.0');
  console.log('\n═══ Auditoria de identidade (somente leitura) ═══');
  console.log(`Persons na base:                         ${rows.length}`);
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
  if (skippedBigBlocks) console.log(`Blocos ignorados por tamanho:            ${skippedBigBlocks}`);

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
    const ra = rows[p.a];
    const rb = rows[p.b];
    lines.push([
      p.result.decision, ra.id, ra.source, rb.id, rb.source,
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

/**
 * audit-identity-mixed.ts
 *
 * Procura SUSPEITAS de "fichas misturadas": uma única Person que reúne nomes
 * incompatíveis entre si — sinal de que pessoas diferentes foram fundidas no
 * passado (ex.: os fluxos de CSV/ERP/Bitrix fundiam por telefone sozinho; o
 * formulário ligava o lead ao candidato antes da revisão).
 *
 * Complementa prisma/audit-identity-duplicates.ts, que só encontra fichas que
 * deveriam estar juntas — não o contrário.
 *
 * É SUSPEITA, não prova: nome canônico genérico, alias incompleto, correção de
 * cadastro ou responsável da clínica também geram nomes "incompatíveis"; e o
 * sinal de ligação mostra um contato compartilhado HOJE, não o que causou a
 * fusão. Serve para montar fila de inspeção — nunca para separar fichas
 * automaticamente.
 *
 * Cálculo em src/lib/identity/identityAudit.ts (o mesmo usado na carga da fila de revisão).
 * SOMENTE LEITURA. Terminal: só contagens. CSV: só IDs e fontes (sem nome/e-mail/telefone).
 *
 * Uso:
 *   docker exec -it dentalgo-bi npx tsx prisma/audit-identity-mixed.ts
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { findMixedSuspects, loadAuditPersons, type LinkSignal } from '../src/lib/identity/identityAudit';

const prisma = new PrismaClient();

async function main() {
  const persons = await loadAuditPersons(prisma);
  const suspects = findMixedSuspects(persons);

  const bySignal = new Map<LinkSignal, number>();
  const bySource = new Map<string, number>();
  const byGroups = new Map<number, number>();
  const lines = ['personId,fontePerson,aliasId,fonteAlias,sinalDeLigacao,gruposDeNome'];

  for (const s of suspects) {
    byGroups.set(s.nameGroups, (byGroups.get(s.nameGroups) || 0) + 1);
    for (const stray of s.strays) {
      bySignal.set(stray.signal, (bySignal.get(stray.signal) || 0) + 1);
      bySource.set(stray.source, (bySource.get(stray.source) || 0) + 1);
      lines.push([s.person.id, s.person.source, stray.aliasId ?? 'canonico', stray.source, stray.signal, s.nameGroups].join(','));
    }
  }

  const pct = (n: number) => (persons.length ? ((n / persons.length) * 100).toFixed(1) : '0.0');
  const sorted = <K>(m: Map<K, number>) => [...m].sort((a, b) => b[1] - a[1]);

  console.log('\n═══ Suspeitas de fichas misturadas (somente leitura) ═══');
  console.log('Suspeita, não prova: use para inspeção manual, nunca para separar automaticamente.');
  console.log(`Persons na base:                          ${persons.length}`);
  console.log(`Suspeitas (nomes incompatíveis na ficha): ${suspects.length} (${pct(suspects.length)}%)`);
  console.log('\nQuantas "pessoas" diferentes por ficha:');
  for (const [n, count] of [...byGroups].sort((a, b) => a[0] - b[0])) {
    console.log(`  ${String(count).padStart(6)}  fichas com ${n} grupos de nome`);
  }
  console.log('\nContato que o nome estranho compartilha hoje com a ficha (indício, não causa comprovada):');
  const labels: Record<LinkSignal, string> = {
    TELEFONE: 'mesmo telefone (fusão por telefone sozinho)',
    EMAIL: 'mesmo e-mail (e-mail compartilhado?)',
    OUTRO: 'outro (ID externo, fusão manual ou sem contato em comum)',
  };
  for (const [signal, n] of sorted(bySignal)) console.log(`  ${String(n).padStart(6)}  ${labels[signal]}`);
  console.log('\nFonte do nome estranho:');
  for (const [source, n] of sorted(bySource).slice(0, 10)) console.log(`  ${String(n).padStart(6)}  ${source}`);

  const fileName = `audit-identity-mixed-${new Date().toISOString().slice(0, 10)}.csv`;
  let outFile = path.join(path.resolve(__dirname, '..', 'scratch'), fileName);
  try {
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.accessSync(path.dirname(outFile), fs.constants.W_OK);
  } catch {
    outFile = path.join(os.tmpdir(), fileName);
  }
  fs.writeFileSync(outFile, lines.join('\n'), 'utf-8');
  console.log(`\nDetalhe (só IDs): ${outFile}`);
}

main()
  .catch(err => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

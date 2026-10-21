/**
 * audit-identity-mixed.ts
 *
 * Procura SUSPEITAS de "fichas misturadas": uma única Person que reúne nomes incompatíveis
 * entre si — sinal de que pessoas diferentes foram fundidas no passado (ex.: os
 * fluxos de CSV/ERP/Bitrix fundiam por telefone sozinho; o formulário ligava o
 * lead ao candidato antes da revisão).
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
 * Usa a mesma regra de nome de src/lib/identity/matchRules.ts.
 * SOMENTE LEITURA. Terminal: só contagens. CSV: só IDs e fontes (sem nome/e-mail/telefone).
 *
 * Uso:
 *   docker exec -it dentalgo-bi npx tsx prisma/audit-identity-mixed.ts
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { compareNames, nameTokens, normalizeEmail, normalizePhone } from '../src/lib/identity/matchRules';

const prisma = new PrismaClient();

type LinkSignal = 'TELEFONE' | 'EMAIL' | 'OUTRO';

interface NamedEntry {
  aliasId: string | null; // null = nome canônico da Person
  source: string;
  name: string;
  email: string | null;
  phone: string | null;
}

function groupCompatibleNames(entries: NamedEntry[]): number[] {
  // União de entradas com nomes compatíveis → cada grupo é "uma pessoa" dentro da ficha.
  const parent = entries.map((_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      if (compareNames([entries[i].name], [entries[j].name]) === 'COMPATIBLE') {
        parent[find(i)] = find(j);
      }
    }
  }
  return entries.map((_, i) => find(i));
}

async function main() {
  const persons = await prisma.person.findMany({
    select: {
      id: true, source: true, fullName: true, email: true, secondaryEmail: true,
      phoneNumber: true, secondaryPhone: true,
      identityAliases: { select: { id: true, source: true, name: true, email: true, phone: true } },
    },
  });

  let mixedPersons = 0;
  const bySignal = new Map<LinkSignal, number>();
  const bySource = new Map<string, number>();
  const byGroups = new Map<number, number>();
  const lines = ['personId,fontePerson,aliasId,fonteAlias,sinalDeLigacao,gruposDeNome'];

  for (const p of persons) {
    const entries: NamedEntry[] = [];
    if (nameTokens(p.fullName).length > 0) {
      entries.push({ aliasId: null, source: p.source, name: p.fullName!, email: normalizeEmail(p.email), phone: normalizePhone(p.phoneNumber) });
    }
    for (const a of p.identityAliases) {
      if (nameTokens(a.name).length > 0) {
        entries.push({ aliasId: a.id, source: a.source, name: a.name!, email: normalizeEmail(a.email), phone: normalizePhone(a.phone) });
      }
    }
    if (entries.length < 2) continue;

    // Nomes idênticos depois de normalizar não precisam ser comparados duas vezes.
    const seen = new Map<string, NamedEntry>();
    const distinct = entries.filter(e => {
      const key = nameTokens(e.name).join(' ');
      if (seen.has(key)) return false;
      seen.set(key, e);
      return true;
    });
    if (distinct.length < 2) continue;

    const groups = groupCompatibleNames(distinct);
    const groupIds = [...new Set(groups)];
    if (groupIds.length < 2) continue;

    mixedPersons++;
    byGroups.set(groupIds.length, (byGroups.get(groupIds.length) || 0) + 1);

    // Grupo principal = o do nome canônico; sem nome canônico, o maior grupo.
    const canonicalIdx = distinct.findIndex(e => e.aliasId === null);
    const mainGroup = canonicalIdx >= 0
      ? groups[canonicalIdx]
      : groupIds.sort((x, y) => groups.filter(g => g === y).length - groups.filter(g => g === x).length)[0];

    const mainEmails = new Set(
      [p.email, p.secondaryEmail, ...distinct.filter((_, i) => groups[i] === mainGroup).map(e => e.email)]
        .map(e => normalizeEmail(e)).filter(Boolean),
    );
    const mainPhones = new Set(
      [p.phoneNumber, p.secondaryPhone, ...distinct.filter((_, i) => groups[i] === mainGroup).map(e => e.phone)]
        .map(t => normalizePhone(t)).filter(Boolean),
    );

    distinct.forEach((e, i) => {
      if (groups[i] === mainGroup) return;
      const signal: LinkSignal = e.phone && mainPhones.has(e.phone)
        ? 'TELEFONE'
        : e.email && mainEmails.has(e.email) ? 'EMAIL' : 'OUTRO';
      bySignal.set(signal, (bySignal.get(signal) || 0) + 1);
      bySource.set(e.source, (bySource.get(e.source) || 0) + 1);
      lines.push([p.id, p.source, e.aliasId ?? 'canonico', e.source, signal, groupIds.length].join(','));
    });
  }

  const pct = (n: number) => (persons.length ? ((n / persons.length) * 100).toFixed(1) : '0.0');
  const sorted = <K>(m: Map<K, number>) => [...m].sort((a, b) => b[1] - a[1]);

  console.log('\n═══ Suspeitas de fichas misturadas (somente leitura) ═══');
  console.log('Suspeita, não prova: use para inspeção manual, nunca para separar automaticamente.');
  console.log(`Persons na base:                          ${persons.length}`);
  console.log(`Suspeitas (nomes incompatíveis na ficha): ${mixedPersons} (${pct(mixedPersons)}%)`);
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

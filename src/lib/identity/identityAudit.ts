/**
 * Cálculos das auditorias de identidade, compartilhados pelos scripts de auditoria
 * (prisma/audit-identity-*.ts) e pela carga da fila de revisão
 * (prisma/load-identity-review-queue.ts). Somente leitura.
 */
import type { PrismaClient } from '@prisma/client';
import {
  compareNames,
  matchIdentities,
  nameTokens,
  normalizeCpf,
  normalizeEmail,
  normalizePhone,
  type IdentitySignals,
  type MatchResult,
} from './matchRules';

export interface AuditPerson {
  id: string;
  source: string;
  createdAt: Date;
  fullName: string | null;
  email: string | null;
  secondaryEmail: string | null;
  phoneNumber: string | null;
  secondaryPhone: string | null;
  cpf: string | null;
  identityAliases: { id: string; source: string; name: string | null; email: string | null; phone: string | null }[];
}

export async function loadAuditPersons(prisma: PrismaClient): Promise<AuditPerson[]> {
  return prisma.person.findMany({
    select: {
      id: true, source: true, createdAt: true, fullName: true, email: true, secondaryEmail: true,
      phoneNumber: true, secondaryPhone: true, cpf: true,
      identityAliases: { select: { id: true, source: true, name: true, email: true, phone: true } },
    },
  });
}

export function signalsOf(p: AuditPerson): IdentitySignals {
  return {
    names: [p.fullName, ...p.identityAliases.map(a => a.name)].filter((n): n is string => !!n),
    emails: [p.email, p.secondaryEmail, ...p.identityAliases.map(a => a.email)].filter((e): e is string => !!e),
    phones: [p.phoneNumber, p.secondaryPhone, ...p.identityAliases.map(a => a.phone)].filter((t): t is string => !!t),
    cpf: p.cpf,
  };
}

// ── Duplicatas ───────────────────────────────────────────────────────────────

export interface DuplicatePair {
  a: AuditPerson;
  b: AuditPerson;
  result: MatchResult;
}

export interface DuplicateAudit {
  pairs: DuplicatePair[];
  /** Grupos de Persons ligadas por junção automática (cada grupo = uma pessoa). */
  mergeClusters: AuditPerson[][];
  skippedBigBlocks: string[];
}

const MAX_BLOCK = 400;

export function findDuplicatePairs(persons: AuditPerson[]): DuplicateAudit {
  const signals = persons.map(signalsOf);

  // Blocagem: só compara fichas que compartilham alguma chave
  const blocks = new Map<string, Set<number>>();
  const add = (key: string | null, i: number) => {
    if (!key) return;
    let set = blocks.get(key);
    if (!set) blocks.set(key, (set = new Set()));
    set.add(i);
  };
  signals.forEach((s, i) => {
    const first = s.names.map(nameTokens).find(t => t.length > 0)?.[0];
    for (const e of s.emails) {
      const email = normalizeEmail(e);
      add(email && `email:${email}`, i);
      // E-mail com erro de digitação: mesmo domínio + mesmo primeiro nome
      if (email && first && first.length >= 2) add(`near:${email.split('@')[1]}:${first}`, i);
    }
    for (const t of s.phones) {
      const phone = normalizePhone(t);
      add(phone && `phone:${phone}`, i);
    }
    const cpf = normalizeCpf(s.cpf);
    add(cpf && `cpf:${cpf}`, i);
  });

  const compared = new Set<string>();
  const found: { a: number; b: number; result: MatchResult }[] = [];
  const skippedBigBlocks: string[] = [];

  for (const [key, members] of blocks) {
    const list = [...members];
    if (list.length < 2) continue;
    // Bloco gigante (ex.: e-mail genérico usado por centenas) — registra e não explode em N².
    if (list.length > MAX_BLOCK) {
      skippedBigBlocks.push(`${key.split(':')[0]} (${list.length} fichas)`);
      continue;
    }
    for (let x = 0; x < list.length; x++) {
      for (let y = x + 1; y < list.length; y++) {
        const a = Math.min(list[x], list[y]);
        const b = Math.max(list[x], list[y]);
        const pairKey = `${a}:${b}`;
        if (compared.has(pairKey)) continue;
        compared.add(pairKey);
        const result = matchIdentities(signals[a], signals[b]);
        if (result.decision !== 'DISTINCT') found.push({ a, b, result });
      }
    }
  }

  // Agrupamento das junções automáticas
  const parent = persons.map((_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) x = parent[x] = parent[parent[x]];
    return x;
  };
  for (const p of found) if (p.result.decision === 'AUTO_MERGE') parent[find(p.a)] = find(p.b);
  const clusters = new Map<number, AuditPerson[]>();
  persons.forEach((person, i) => {
    const root = find(i);
    clusters.set(root, [...(clusters.get(root) || []), person]);
  });

  return {
    pairs: found.map(p => ({ a: persons[p.a], b: persons[p.b], result: p.result })),
    mergeClusters: [...clusters.values()].filter(c => c.length > 1),
    skippedBigBlocks,
  };
}

/**
 * Qual ficha fica numa junção: FATO antes de DESEJO (DentalGO/ERP/CSV antes de
 * Bitrix e formulários), depois a com mais aliases, depois a mais antiga.
 */
const SOURCE_PRIORITY = ['DENTALGO', 'ERP', 'CSV_IMPORT', 'CSV', 'API Sync (Cart)', 'BITRIX', 'MANUAL'];
const sourceRank = (source: string) => {
  const i = SOURCE_PRIORITY.indexOf(source);
  if (i >= 0) return i;
  return source.startsWith('Form Capture') ? SOURCE_PRIORITY.length + 1 : SOURCE_PRIORITY.length;
};

export function pickSurvivor(group: AuditPerson[]): AuditPerson {
  return [...group].sort((x, y) =>
    sourceRank(x.source) - sourceRank(y.source)
    || y.identityAliases.length - x.identityAliases.length
    || x.createdAt.getTime() - y.createdAt.getTime()
    || x.id.localeCompare(y.id),
  )[0];
}

// ── Suspeitas de fichas misturadas ──────────────────────────────────────────

export type LinkSignal = 'TELEFONE' | 'EMAIL' | 'OUTRO';

export interface MixedSuspect {
  person: AuditPerson;
  nameGroups: number;
  /** Entradas cujo nome não é compatível com o grupo principal da ficha. */
  strays: { aliasId: string | null; source: string; signal: LinkSignal }[];
}

interface NamedEntry {
  aliasId: string | null; // null = nome canônico da Person
  source: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export function findMixedSuspects(persons: AuditPerson[]): MixedSuspect[] {
  const suspects: MixedSuspect[] = [];

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
    // Nomes idênticos depois de normalizar não precisam ser comparados duas vezes
    const seen = new Set<string>();
    const distinct = entries.filter(e => {
      const key = nameTokens(e.name).join(' ');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (distinct.length < 2) continue;

    // União de entradas com nomes compatíveis → cada grupo é "uma pessoa" dentro da ficha
    const parent = distinct.map((_, i) => i);
    const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    for (let i = 0; i < distinct.length; i++) {
      for (let j = i + 1; j < distinct.length; j++) {
        if (compareNames([distinct[i].name], [distinct[j].name]) === 'COMPATIBLE') parent[find(i)] = find(j);
      }
    }
    const groups = distinct.map((_, i) => find(i));
    const groupIds = [...new Set(groups)];
    if (groupIds.length < 2) continue;

    // Grupo principal = o do nome canônico; sem nome canônico, o maior grupo
    const canonicalIdx = distinct.findIndex(e => e.aliasId === null);
    const size = (g: number) => groups.filter(x => x === g).length;
    const mainGroup = canonicalIdx >= 0 ? groups[canonicalIdx] : [...groupIds].sort((x, y) => size(y) - size(x))[0];

    const inMain = distinct.filter((_, i) => groups[i] === mainGroup);
    const mainEmails = new Set([p.email, p.secondaryEmail, ...inMain.map(e => e.email)].map(e => normalizeEmail(e)).filter(Boolean));
    const mainPhones = new Set([p.phoneNumber, p.secondaryPhone, ...inMain.map(e => e.phone)].map(t => normalizePhone(t)).filter(Boolean));

    suspects.push({
      person: p,
      nameGroups: groupIds.length,
      strays: distinct
        .filter((_, i) => groups[i] !== mainGroup)
        .map(e => ({
          aliasId: e.aliasId,
          source: e.source,
          signal: e.phone && mainPhones.has(e.phone) ? 'TELEFONE' : e.email && mainEmails.has(e.email) ? 'EMAIL' : 'OUTRO',
        })),
    });
  }
  return suspects;
}

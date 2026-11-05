/**
 * Diagnóstico e reparo de Persons sem nome, e-mail e telefone.
 *
 * Origens conhecidas (2026-11):
 *  - prisma/seed-persons.ts (migração do CDP V4, ago–set/2026) criou uma Person vazia para
 *    cada cadastro sem dados, com o source padrão do Customer ("DENTALGO") — a maioria;
 *  - a entrada em campanha consultava uma coluna inexistente (`people.name`) e criava a
 *    ficha só com o externalPersonId.
 *
 * Reparo: só preenche campos VAZIOS — nunca sobrescreve. Cada campo vem da primeira fonte
 * que o tiver, nesta ordem (FATO antes de DESEJO):
 *   1. DentalGO (MySQL), pelo ID do DentalGO da ficha ou de um cadastro ligado a ela;
 *   2. dados gravados no cadastro (Customer.metadata);
 *   3. retrato do envio gravado na oportunidade (formulários);
 *   4. registros de origem (aliases).
 * Fichas órfãs (sem dados, sem alias, sem cadastro) só são removidas com opção explícita.
 */
import type { PrismaClient } from '@prisma/client';
import { nameTokens, normalizeCpf, normalizeEmail, normalizePhone } from './matchRules';

export interface DentalGoPersonData {
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
  cpf: string | null;
}

/** Busca pessoas no MySQL do DentalGO por id. */
export type DentalGoLookup = (ids: number[]) => Promise<Map<number, DentalGoPersonData>>;

export type EmptyPersonCategory =
  | 'FILL_FROM_DENTALGO'        // o DentalGO tem os dados (pelo ID da ficha ou do cadastro)
  | 'FILL_FROM_RECORDS'         // dados no cadastro ou na oportunidade
  | 'FILL_FROM_ALIAS'           // dados num registro de origem
  | 'DENTALGO_WITHOUT_DATA'     // tem ID do DentalGO, mas o DentalGO não tem dados
  | 'NO_DATA_WITH_RECORDS'      // sem dados em lugar nenhum, mas com cadastro ligado
  | 'ORPHAN';                   // sem dados, sem alias e sem cadastro

export interface PersonFill {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  cpf?: string;
  externalPersonId?: number;
}

export interface EmptyPersonPlanItem {
  personId: string;
  category: EmptyPersonCategory;
  source: string;
  createdMonth: string;
  fill?: PersonFill;
}

interface Candidate {
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  cpf?: string | null;
}

/** Primeiro valor válido de cada campo, na ordem de prioridade das fontes. */
function mergeFill(sources: Candidate[]): PersonFill {
  const fill: PersonFill = {};
  for (const c of sources) {
    if (!fill.fullName && c.fullName && nameTokens(c.fullName).length > 0) fill.fullName = c.fullName.trim();
    if (!fill.email) { const e = normalizeEmail(c.email); if (e) fill.email = e; }
    if (!fill.phoneNumber) { const t = normalizePhone(c.phoneNumber); if (t) fill.phoneNumber = t; }
    if (!fill.cpf) { const d = normalizeCpf(c.cpf); if (d) fill.cpf = d; }
  }
  return fill;
}

const fromMeta = (m: unknown): Candidate => {
  const meta = (m && typeof m === 'object' ? m : {}) as Record<string, any>;
  return {
    fullName: meta.fullName || meta.name || meta.submittedName || null,
    email: meta.email || meta.submittedEmail || null,
    phoneNumber: meta.phoneNumber || meta.phone || meta.submittedPhone || null,
  };
};

export async function planEmptyPersonRepair(prisma: PrismaClient, lookup: DentalGoLookup): Promise<EmptyPersonPlanItem[]> {
  const empty = await prisma.person.findMany({
    where: { fullName: null, email: null, phoneNumber: null },
    select: {
      id: true, source: true, createdAt: true, externalPersonId: true, cpf: true,
      identityAliases: { select: { name: true, email: true, phone: true }, orderBy: { createdAt: 'asc' } },
      customers: {
        select: {
          externalPersonId: true,
          metadata: true,
          opportunities: { select: { metadata: true }, orderBy: { createdAt: 'desc' }, take: 5 },
        },
      },
    },
  });

  // IDs do DentalGO: da própria ficha ou de um cadastro ligado a ela
  const dentalGoIdOf = (p: typeof empty[number]) =>
    p.externalPersonId ?? p.customers.find(c => c.externalPersonId !== null)?.externalPersonId ?? null;
  const ids = [...new Set(empty.map(dentalGoIdOf).filter((id): id is number => id !== null))];
  const dentalgo = new Map<number, DentalGoPersonData>();
  for (let i = 0; i < ids.length; i += 500) {
    for (const [id, data] of await lookup(ids.slice(i, i + 500))) dentalgo.set(id, data);
  }

  return empty.map(p => {
    const base = { personId: p.id, source: p.source, createdMonth: p.createdAt.toISOString().slice(0, 7) };
    const dgId = dentalGoIdOf(p);
    const dg = dgId !== null ? dentalgo.get(dgId) : undefined;

    const dgFill = dg ? mergeFill([dg]) : {};
    const recordsFill = mergeFill([
      ...p.customers.map(c => fromMeta(c.metadata)),
      ...p.customers.flatMap(c => c.opportunities.map(o => fromMeta(o.metadata))),
    ]);
    const aliasFill = mergeFill(p.identityAliases.map(a => ({ fullName: a.name, email: a.email, phoneNumber: a.phone })));

    const fill = mergeFill([dgFill, recordsFill, aliasFill].map(f => ({ ...f })));
    if (p.cpf) delete fill.cpf;
    if (p.externalPersonId === null && dgId !== null && Object.keys(dgFill).length > 0) fill.externalPersonId = dgId;

    if (Object.keys(fill).some(k => k !== 'externalPersonId')) {
      const category: EmptyPersonCategory = Object.keys(dgFill).length > 0
        ? 'FILL_FROM_DENTALGO'
        : Object.keys(recordsFill).length > 0 ? 'FILL_FROM_RECORDS' : 'FILL_FROM_ALIAS';
      return { ...base, category, fill };
    }
    if (dgId !== null) return { ...base, category: 'DENTALGO_WITHOUT_DATA' };
    if (p.customers.length > 0) return { ...base, category: 'NO_DATA_WITH_RECORDS' };
    return { ...base, category: p.identityAliases.length > 0 ? 'NO_DATA_WITH_RECORDS' : 'ORPHAN' };
  });
}

/**
 * Aplica o plano: preenche só os campos que continuam vazios (a ficha pode ter sido
 * completada entre o plano e a aplicação). Retorna quantas fichas mudaram.
 */
export async function applyEmptyPersonRepair(prisma: PrismaClient, plan: EmptyPersonPlanItem[]): Promise<number> {
  let changed = 0;
  for (const item of plan) {
    if (!item.fill) continue;
    const current = await prisma.person.findUnique({
      where: { id: item.personId },
      select: { fullName: true, email: true, phoneNumber: true, cpf: true, externalPersonId: true },
    });
    if (!current) continue;
    const data: Record<string, string | number> = {};
    for (const [field, value] of Object.entries(item.fill)) {
      if (value !== undefined && value !== null && (current as any)[field] === null) data[field] = value;
    }
    if (Object.keys(data).length === 0) continue;
    await prisma.person.update({ where: { id: item.personId }, data });
    changed++;
  }
  return changed;
}

/**
 * Remove fichas órfãs do plano, conferindo de novo na hora (dentro da transação): só sai a
 * ficha que continua sem nome/e-mail/telefone, sem alias e sem cadastro. Registra os IDs
 * removidos em DomainEvent (IDENTITY_EMPTY_ORPHANS_REMOVED). Retorna quantas saíram.
 */
export async function removeEmptyOrphans(prisma: PrismaClient, plan: EmptyPersonPlanItem[], actorId: string | null): Promise<number> {
  const candidates = plan.filter(i => i.category === 'ORPHAN').map(i => i.personId);
  let removed = 0;
  for (let i = 0; i < candidates.length; i += 500) {
    const chunk = candidates.slice(i, i + 500);
    removed += await prisma.$transaction(async tx => {
      const stillOrphan = (await tx.person.findMany({
        where: {
          id: { in: chunk },
          fullName: null, email: null, phoneNumber: null,
          identityAliases: { none: {} },
          customers: { none: {} },
        },
        select: { id: true, source: true, createdAt: true, externalPersonId: true, cpf: true },
      }));
      if (stillOrphan.length === 0) return 0;
      await tx.person.deleteMany({ where: { id: { in: stillOrphan.map(p => p.id) } } });
      await tx.domainEvent.create({
        data: {
          type: 'IDENTITY_EMPTY_ORPHANS_REMOVED',
          actorType: actorId ? 'USER' : 'SYSTEM',
          actorId,
          metadata: JSON.parse(JSON.stringify({ removed: stillOrphan })),
        },
      });
      return stillOrphan.length;
    });
  }
  return removed;
}

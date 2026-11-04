/**
 * Diagnóstico e reparo de Persons sem nome, e-mail e telefone.
 *
 * Origem principal conhecida (2026-11): a entrada em campanha consultava o MySQL com uma
 * coluna inexistente (`people.name`); a consulta falhava sempre e a pessoa do DentalGO
 * ganhava uma ficha só com o externalPersonId.
 *
 * Reparo: só preenche campos VAZIOS — nunca sobrescreve.
 *  - com externalPersonId: dados do DentalGO (FATO): nome, e-mail, telefone e CPF;
 *  - sem ID, mas com alias que tem dados: dados do alias.
 * Fichas sem dados em lugar nenhum são só relatadas (com cadastro ligado ou órfãs).
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
  | 'FILL_FROM_DENTALGO'        // tem ID do DentalGO e o MySQL tem dados
  | 'FILL_FROM_ALIAS'           // sem ID, mas algum alias tem dados
  | 'DENTALGO_WITHOUT_DATA'     // tem ID do DentalGO, mas o MySQL não tem dados (ou a pessoa não existe lá)
  | 'NO_DATA_WITH_RECORDS'      // sem dados em lugar nenhum, mas com cadastro ligado
  | 'ORPHAN';                   // sem dados e sem nada ligado

export interface EmptyPersonPlanItem {
  personId: string;
  category: EmptyPersonCategory;
  source: string;
  createdMonth: string;
  fill?: { fullName?: string; email?: string; phoneNumber?: string; cpf?: string };
}

export async function planEmptyPersonRepair(prisma: PrismaClient, lookup: DentalGoLookup): Promise<EmptyPersonPlanItem[]> {
  const empty = await prisma.person.findMany({
    where: { fullName: null, email: null, phoneNumber: null },
    select: {
      id: true, source: true, createdAt: true, externalPersonId: true, cpf: true,
      identityAliases: { select: { name: true, email: true, phone: true }, orderBy: { createdAt: 'asc' } },
      _count: { select: { customers: true } },
    },
  });

  const ids = [...new Set(empty.map(p => p.externalPersonId).filter((id): id is number => id !== null))];
  const dentalgo = new Map<number, DentalGoPersonData>();
  for (let i = 0; i < ids.length; i += 500) {
    for (const [id, data] of await lookup(ids.slice(i, i + 500))) dentalgo.set(id, data);
  }

  return empty.map(p => {
    const base = { personId: p.id, source: p.source, createdMonth: p.createdAt.toISOString().slice(0, 7) };

    if (p.externalPersonId !== null) {
      const d = dentalgo.get(p.externalPersonId);
      const fill = d ? cleanFill({ fullName: d.fullName, email: d.email, phoneNumber: d.phoneNumber, cpf: p.cpf ? null : d.cpf }) : {};
      if (Object.keys(fill).length > 0) return { ...base, category: 'FILL_FROM_DENTALGO', fill };
    } else {
      // Primeiro alias com nome; e-mail/telefone do primeiro alias que tiver cada um
      const fill = cleanFill({
        fullName: p.identityAliases.find(a => nameTokens(a.name).length > 0)?.name ?? null,
        email: p.identityAliases.find(a => normalizeEmail(a.email))?.email ?? null,
        phoneNumber: p.identityAliases.find(a => normalizePhone(a.phone))?.phone ?? null,
        cpf: null,
      });
      if (Object.keys(fill).length > 0) return { ...base, category: 'FILL_FROM_ALIAS', fill };
    }

    if (p.externalPersonId !== null) return { ...base, category: 'DENTALGO_WITHOUT_DATA' };
    return { ...base, category: p._count.customers > 0 ? 'NO_DATA_WITH_RECORDS' : 'ORPHAN' };
  });
}

function cleanFill(raw: { fullName: string | null; email: string | null; phoneNumber: string | null; cpf: string | null }) {
  const fill: EmptyPersonPlanItem['fill'] = {};
  if (raw.fullName && nameTokens(raw.fullName).length > 0) fill.fullName = raw.fullName.trim();
  const email = normalizeEmail(raw.email);
  if (email) fill.email = email;
  const phone = normalizePhone(raw.phoneNumber);
  if (phone) fill.phoneNumber = phone;
  const cpf = normalizeCpf(raw.cpf);
  if (cpf) fill.cpf = cpf;
  return fill;
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
      select: { fullName: true, email: true, phoneNumber: true, cpf: true },
    });
    if (!current) continue;
    const data: Record<string, string> = {};
    for (const [field, value] of Object.entries(item.fill)) {
      if (value && (current as any)[field] === null) data[field] = value;
    }
    if (Object.keys(data).length === 0) continue;
    await prisma.person.update({ where: { id: item.personId }, data });
    changed++;
  }
  return changed;
}

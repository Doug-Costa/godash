/**
 * Entrada em campanha × identidade. Antes, quem entrava numa campanha sem ficha com o
 * ID do DentalGO ganhava uma Person nova, criada direto — duplicando quem já tinha vindo
 * por CSV, Bitrix ou formulário. Requer Postgres descartável (DATABASE_URL); o MySQL do
 * DentalGO é simulado.
 */
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mysqlPeople = new Map<number, { fullName: string | null; email: string | null; phoneNumber: string | null }>();
vi.mock('../db', () => ({
  default: {
    query: async (_sql: string, params: number[]) => {
      const row = mysqlPeople.get(Number(params[0]));
      return [row ? [row] : []];
    },
  },
}));

import prisma from '../prisma';
import { AssignCampaignLeadsUseCase } from './AssignCampaignLeadsUseCase';
import { CanonicalIdentityService } from '../services/CanonicalIdentityService';

const SOURCE = 'CAMPAIGN_TEST';
const IDS = [910001, 910002, 910003, 910004];

async function cleanup() {
  await prisma.identityReview.deleteMany({ where: { incomingSource: 'DENTALGO', incomingExternalId: { in: IDS.map(String) } } });
  await prisma.person.deleteMany({
    where: { OR: [{ source: SOURCE }, { externalPersonId: { in: IDS } }, { identityAliases: { some: { source: 'DENTALGO', externalId: { in: IDS.map(String) } } } }] },
  });
  await prisma.journey.deleteMany({ where: { objective: SOURCE } });
  await prisma.pipeline.deleteMany({ where: { name: SOURCE } });
}

const assign = async (ids: number[]) => {
  // Funil próprio: sem ele o caso de uso pega "qualquer funil", que pode ser o temporário de outro teste
  const pipeline = await prisma.pipeline.create({ data: { name: SOURCE } });
  const journey = await prisma.journey.create({ data: { name: 'Campanha teste', objective: SOURCE, pipelineId: pipeline.id } });
  await new AssignCampaignLeadsUseCase().execute(ids, journey.id, [], undefined, { mode: 'POOL' });
  return journey;
};

describe.skipIf(!process.env.DATABASE_URL)('entrada em campanha × identidade', () => {
  beforeEach(async () => {
    mysqlPeople.clear();
    await cleanup();
  });
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  it('pessoa que já veio do Bitrix NÃO ganha ficha nova ao entrar na campanha', async () => {
    const bitrix = await prisma.person.create({ data: { fullName: 'Sara Moura', email: 'sara@campanha-teste.com', source: SOURCE } });
    mysqlPeople.set(IDS[0], { fullName: 'Sara Moura', email: 'Sara@Campanha-Teste.com', phoneNumber: null });

    const journey = await assign([IDS[0]]);

    const customer = await prisma.customer.findFirstOrThrow({ where: { journeyId: journey.id } });
    expect(customer.personId).toBe(bitrix.id);
    expect((await prisma.person.findUniqueOrThrow({ where: { id: bitrix.id } })).externalPersonId).toBe(IDS[0]);
    expect(await prisma.person.count({ where: { OR: [{ id: bitrix.id }, { externalPersonId: IDS[0] }] } })).toBe(1);
    expect(await prisma.identityAlias.count({ where: { source: 'DENTALGO', externalId: String(IDS[0]), personId: bitrix.id } })).toBe(1);
  });

  it('ficha que já tem o ID do DentalGO é reaproveitada e completada', async () => {
    const existente = await prisma.person.create({ data: { externalPersonId: IDS[1], source: SOURCE } });
    mysqlPeople.set(IDS[1], { fullName: 'Tiago Rocha', email: 'tiago@campanha-teste.com', phoneNumber: '11944443333' });

    const journey = await assign([IDS[1]]);

    expect((await prisma.customer.findFirstOrThrow({ where: { journeyId: journey.id } })).personId).toBe(existente.id);
    const completada = await prisma.person.findUniqueOrThrow({ where: { id: existente.id } });
    expect(completada.fullName).toBe('Tiago Rocha');
    expect(completada.email).toBe('tiago@campanha-teste.com');
  });

  it('duas entradas simultâneas da mesma pessoa criam UMA ficha', async () => {
    mysqlPeople.set(IDS[2], { fullName: 'Úrsula Vaz', email: 'ursula@campanha-teste.com', phoneNumber: null });
    const people = await Promise.all([
      CanonicalIdentityService.resolveDentalGoPerson(IDS[2], mysqlPeople.get(IDS[2])),
      CanonicalIdentityService.resolveDentalGoPerson(IDS[2], mysqlPeople.get(IDS[2])),
      CanonicalIdentityService.resolveDentalGoPerson(IDS[2], mysqlPeople.get(IDS[2])),
    ]);
    expect(new Set(people.map(p => p.id)).size).toBe(1);
    expect(await prisma.person.count({ where: { externalPersonId: IDS[2] } })).toBe(1);
  });

  it('caso ambíguo: e-mail de uma ficha, telefone de outra → ficha provisória isolada e revisão', async () => {
    const a = await prisma.person.create({ data: { fullName: 'Vera Lins', email: 'vera@campanha-teste.com', source: SOURCE } });
    const b = await prisma.person.create({ data: { fullName: 'Vera Lins', phoneNumber: '+5521933332222', source: SOURCE } });
    mysqlPeople.set(IDS[3], { fullName: 'Vera Lins', email: 'vera@campanha-teste.com', phoneNumber: '21933332222' });

    const journey = await assign([IDS[3]]);

    const customer = await prisma.customer.findFirstOrThrow({ where: { journeyId: journey.id } });
    expect([a.id, b.id]).not.toContain(customer.personId);
    expect((await prisma.person.findUniqueOrThrow({ where: { id: customer.personId } })).externalPersonId).toBe(IDS[3]);
    const review = await prisma.identityReview.findFirst({ where: { incomingSource: 'DENTALGO', incomingExternalId: String(IDS[3]) } });
    expect(review?.status).toBe('PENDING');
    expect(review?.evidences).toEqual(expect.arrayContaining(['AMBIGUOUS_PROVISIONAL', `CANDIDATE:${a.id}`, `CANDIDATE:${b.id}`]));
  });
});

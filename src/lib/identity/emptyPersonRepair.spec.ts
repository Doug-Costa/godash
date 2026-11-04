/**
 * Reparo de fichas vazias: classifica e completa só campos vazios.
 * Requer Postgres descartável (DATABASE_URL); o MySQL do DentalGO é simulado.
 */
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import prisma from '../prisma';
import { applyEmptyPersonRepair, planEmptyPersonRepair, type DentalGoLookup } from './emptyPersonRepair';

const SOURCE = 'EMPTY_TEST';
const EXT = [930001, 930002];

const fakeDentalGo: DentalGoLookup = async ids => new Map(
  [
    [EXT[0], { fullName: 'Paulo Teles', email: 'Paulo@Teste.com', phoneNumber: '44991112222', cpf: '529.982.247-25' }],
    [EXT[1], { fullName: null, email: null, phoneNumber: null, cpf: null }],
  ].filter(([id]) => ids.includes(id as number)) as any,
);

async function cleanup() {
  await prisma.person.deleteMany({ where: { source: SOURCE } });
}

describe.skipIf(!process.env.DATABASE_URL)('reparo de fichas vazias', () => {
  beforeEach(cleanup);
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  it('classifica cada ficha vazia e completa só o que tem de onde puxar', async () => {
    const dentalgo = await prisma.person.create({ data: { externalPersonId: EXT[0], source: SOURCE } });
    const dentalgoSemDados = await prisma.person.create({ data: { externalPersonId: EXT[1], source: SOURCE } });
    const comAlias = await prisma.person.create({
      data: { source: SOURCE, identityAliases: { create: { source: SOURCE, externalId: 'al1', name: 'Rita Gomes', email: 'rita@teste.com' } } },
    });
    const comCadastro = await prisma.person.create({ data: { source: SOURCE } });
    await prisma.customer.create({ data: { personId: comCadastro.id, source: SOURCE } });
    const orfa = await prisma.person.create({ data: { source: SOURCE } });
    const naoVazia = await prisma.person.create({ data: { fullName: 'Já Tem Nome', source: SOURCE } });

    const plan = (await planEmptyPersonRepair(prisma, fakeDentalGo)).filter(i => i.source === SOURCE);
    const cat = Object.fromEntries(plan.map(i => [i.personId, i.category]));
    expect(cat[dentalgo.id]).toBe('FILL_FROM_DENTALGO');
    expect(cat[dentalgoSemDados.id]).toBe('DENTALGO_WITHOUT_DATA');
    expect(cat[comAlias.id]).toBe('FILL_FROM_ALIAS');
    expect(cat[comCadastro.id]).toBe('NO_DATA_WITH_RECORDS');
    expect(cat[orfa.id]).toBe('ORPHAN');
    expect(cat[naoVazia.id]).toBeUndefined();

    // A simulação não grava
    expect((await prisma.person.findUniqueOrThrow({ where: { id: dentalgo.id } })).fullName).toBeNull();

    expect(await applyEmptyPersonRepair(prisma, plan)).toBe(2);
    const a = await prisma.person.findUniqueOrThrow({ where: { id: dentalgo.id } });
    expect(a).toMatchObject({ fullName: 'Paulo Teles', email: 'paulo@teste.com', phoneNumber: '+5544991112222', cpf: '52998224725' });
    const b = await prisma.person.findUniqueOrThrow({ where: { id: comAlias.id } });
    expect(b).toMatchObject({ fullName: 'Rita Gomes', email: 'rita@teste.com' });

    // Nada é apagado
    expect(await prisma.person.count({ where: { id: { in: [orfa.id, comCadastro.id, dentalgoSemDados.id] } } })).toBe(3);
  });

  it('nunca sobrescreve um campo que alguém preencheu depois do plano', async () => {
    const p = await prisma.person.create({ data: { externalPersonId: EXT[0], source: SOURCE } });
    const plan = (await planEmptyPersonRepair(prisma, fakeDentalGo)).filter(i => i.personId === p.id);
    await prisma.person.update({ where: { id: p.id }, data: { fullName: 'Nome Corrigido à Mão' } });

    await applyEmptyPersonRepair(prisma, plan);
    const depois = await prisma.person.findUniqueOrThrow({ where: { id: p.id } });
    expect(depois.fullName).toBe('Nome Corrigido à Mão');
    expect(depois.email).toBe('paulo@teste.com');
  });
});

/**
 * inspectDentalGoPerson() (simulação, só leitura) tem que prever exatamente o que
 * resolveDentalGoPerson() (gravação) faz — e não gravar nada.
 * Requer Postgres descartável (DATABASE_URL), com as migrations aplicadas.
 */
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import prisma from '../prisma';
import { CanonicalIdentityService } from './CanonicalIdentityService';

const SOURCE = 'DGSIM_TEST';
const DOMAIN = '@dgsim.teste';
const IDS = [940001, 940002, 940003, 940004, 940005, 940006];

async function cleanup() {
  await prisma.identityReview.deleteMany({ where: { incomingSource: 'DENTALGO', incomingExternalId: { in: IDS.map(String) } } });
  await prisma.identityAlias.deleteMany({
    where: { OR: [{ source: 'DENTALGO', externalId: { in: IDS.map(String) } }, { person: { source: SOURCE } }] },
  });
  await prisma.person.deleteMany({
    where: { OR: [{ source: SOURCE }, { externalPersonId: { in: IDS } }, { email: { endsWith: DOMAIN } }] },
  });
}

// Só os dados deste teste (os outros arquivos de teste gravam no mesmo banco em paralelo)
const counts = async () => ({
  persons: await prisma.person.count({ where: { OR: [{ email: { endsWith: DOMAIN } }, { externalPersonId: { in: IDS } }] } }),
  aliases: await prisma.identityAlias.count({ where: { OR: [{ email: { endsWith: DOMAIN } }, { source: 'DENTALGO', externalId: { in: IDS.map(String) } }] } }),
  reviews: await prisma.identityReview.count({ where: { incomingSource: 'DENTALGO', incomingExternalId: { in: IDS.map(String) } } }),
  dentalGoIds: await prisma.person.count({ where: { email: { endsWith: DOMAIN }, externalPersonId: { not: null } } }),
});

describe.skipIf(!process.env.DATABASE_URL)('CanonicalIdentityService — simulação da base do DentalGO', () => {
  beforeEach(cleanup);
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  it('caso Ana Lieber: ficha do CSV + conta do DentalGO com o mesmo e-mail → seria ligada, e a gravação liga', async () => {
    const csv = await prisma.person.create({
      data: { fullName: 'ANA KARINA SCHOBER DOS SANTOS LIEBER', email: `ana${DOMAIN}`, phoneNumber: '+5541999990000', source: SOURCE },
    });
    const dg = { fullName: 'Ana Lieber', email: `ANA${DOMAIN}`, phoneNumber: '41988887777', cpf: null };

    const before = await counts();
    const sim = await CanonicalIdentityService.inspectDentalGoPerson(IDS[0], dg);
    expect(sim).toEqual({ outcome: 'WOULD_LINK', personId: csv.id, personHasOtherDentalGoId: false });
    expect(await counts()).toEqual(before); // simulação não grava

    const person = await CanonicalIdentityService.resolveDentalGoPerson(IDS[0], dg);
    expect(person.id).toBe(csv.id);
    expect(person.externalPersonId).toBe(IDS[0]);
    expect(await CanonicalIdentityService.inspectDentalGoPerson(IDS[0], dg)).toEqual({ outcome: 'LINKED_BY_ID', personId: csv.id });
  });

  it('mesmo e-mail com nome muito diferente → revisão, e a gravação cria ficha separada + revisão', async () => {
    const crm = await prisma.person.create({ data: { fullName: 'Marcos Silva', email: `clinica${DOMAIN}`, source: SOURCE } });
    const dg = { fullName: 'Juliana Prado', email: `clinica${DOMAIN}`, phoneNumber: null, cpf: null };

    const sim = await CanonicalIdentityService.inspectDentalGoPerson(IDS[1], dg);
    expect(sim.outcome).toBe('REVIEW');

    const person = await CanonicalIdentityService.resolveDentalGoPerson(IDS[1], dg);
    expect(person.id).not.toBe(crm.id);
    expect(await prisma.identityReview.count({ where: { incomingSource: 'DENTALGO', incomingExternalId: String(IDS[1]), status: 'PENDING' } })).toBe(1);
  });

  it('CPF válido diferente bloqueia a junção mesmo com e-mail e nome compatíveis', async () => {
    await prisma.person.create({ data: { fullName: 'Paulo Teles', email: `paulo${DOMAIN}`, cpf: '52998224725', source: SOURCE } });
    const sim = await CanonicalIdentityService.inspectDentalGoPerson(IDS[2], {
      fullName: 'Paulo Teles', email: `paulo${DOMAIN}`, phoneNumber: null, cpf: '111.444.777-35',
    });
    expect(sim.outcome).toBe('REVIEW');
  });

  it('ninguém no CRM com o mesmo contato → ficha nova, e a gravação cria a ficha com o ID do DentalGO', async () => {
    const dg = { fullName: 'Renata Alves', email: `renata${DOMAIN}`, phoneNumber: null, cpf: null };
    expect(await CanonicalIdentityService.inspectDentalGoPerson(IDS[3], dg)).toEqual({ outcome: 'NEW', reason: 'NO_CANDIDATE' });

    const person = await CanonicalIdentityService.resolveDentalGoPerson(IDS[3], dg);
    expect(person).toMatchObject({ fullName: 'Renata Alves', email: `renata${DOMAIN}`, externalPersonId: IDS[3] });
  });

  it('avisa quando a ficha encontrada já tem OUTRO ID do DentalGO (duas contas da mesma pessoa)', async () => {
    const crm = await prisma.person.create({
      data: { fullName: 'Carla Menezes', email: `carla${DOMAIN}`, externalPersonId: IDS[4], source: SOURCE },
    });
    const sim = await CanonicalIdentityService.inspectDentalGoPerson(IDS[5], {
      fullName: 'Carla Menezes', email: `carla${DOMAIN}`, phoneNumber: null, cpf: null,
    });
    expect(sim).toEqual({ outcome: 'WOULD_LINK', personId: crm.id, personHasOtherDentalGoId: true });
  });
});

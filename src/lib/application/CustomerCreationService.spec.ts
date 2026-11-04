/**
 * Formulários e sincronização DentalGO (CustomerCreationService) × identidade.
 *
 * Antes (reproduzido em 2026-11-03): no caso duvidoso o lead era ligado à ficha candidata
 * ANTES da revisão; a revisão e o alias tinham ids aleatórios diferentes, então a tela
 * mostrava "Sem nome" e "Manter separado" criava uma ficha vazia, deixando o lead na
 * ficha errada. Requer Postgres descartável (DATABASE_URL).
 */
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import prisma from '../prisma';
import { IdentityMatchingService } from '../services/IdentityMatchingService';
import { CustomerCreationService } from './CustomerCreationService';

const SOURCE = 'Form Capture: Curso Teste';
const FATO = 'FORM_SYNC_TEST';
const EXT = [920001, 920002];
const TESTER_EMAIL = 'form-tester@teste.local';
let tester = '';

async function cleanup() {
  await prisma.identityReview.deleteMany({ where: { incomingSource: { in: [SOURCE, 'DENTALGO'] }, OR: [{ incomingSource: SOURCE }, { incomingExternalId: { in: EXT.map(String) } }] } });
  await prisma.person.deleteMany({ where: { OR: [{ source: { in: [SOURCE, FATO] } }, { externalPersonId: { in: EXT } }] } });
  await prisma.user.deleteMany({ where: { email: TESTER_EMAIL } });
}

const lead = (metadata: Record<string, any>, extra: Record<string, any> = {}) =>
  CustomerCreationService.createOrMerge({ metadata, source: SOURCE, isPurchase: false, ...extra } as any);

describe.skipIf(!process.env.DATABASE_URL)('formulário e sincronização × identidade', () => {
  beforeEach(async () => {
    await cleanup();
    tester = (await prisma.user.create({ data: { email: TESTER_EMAIL, name: 'Revisor formulário' } })).id;
  });
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  it('e-mail da clínica com outra pessoa: NÃO vai para a ficha da Maria; revisão encontra o lead', async () => {
    const maria = await prisma.person.create({ data: { fullName: 'Maria Silva', email: 'contato@clinica-form.com', source: FATO } });

    const customer = await lead({ fullName: 'João Pereira', email: 'contato@clinica-form.com', phoneNumber: '11955554444' });

    // O lead fica numa ficha provisória, não na da Maria
    expect(customer.personId).not.toBe(maria.id);
    expect(await prisma.customer.count({ where: { personId: maria.id } })).toBe(0);
    expect((customer.metadata as any).hasPendingReview).toBe(true);

    // A revisão aponta para o alias do lead (mesmo id) — a tela consegue mostrar o nome
    const review = await prisma.identityReview.findFirstOrThrow({ where: { incomingSource: SOURCE } });
    const alias = await prisma.identityAlias.findUnique({
      where: { source_externalId: { source: review.incomingSource, externalId: review.incomingExternalId } },
    });
    expect(alias?.name).toBe('João Pereira');
    expect(alias?.personId).toBe(customer.personId);

    // "É outra pessoa" mantém a ficha do João (com nome), sem criar ficha vazia
    const confirmada = await IdentityMatchingService.reject(review.id, tester);
    expect(confirmada.id).toBe(customer.personId);
    expect(confirmada.fullName).toBe('João Pereira');
  });

  it('mesmo e-mail + nome compatível: junta na ficha existente sem trocar o nome canônico (FATO > DESEJO)', async () => {
    const fato = await prisma.person.create({ data: { fullName: 'Douglas Henrique Costa', email: 'douglas@form-teste.com', source: FATO } });

    const customer = await lead({ fullName: 'Douglas Costa', email: 'Douglas@Form-Teste.com', phoneNumber: '44988887777' });

    expect(customer.personId).toBe(fato.id);
    const depois = await prisma.person.findUniqueOrThrow({ where: { id: fato.id } });
    expect(depois.fullName).toBe('Douglas Henrique Costa');
    expect(depois.phoneNumber).toBe('+5544988887777'); // campo vazio é completado
    expect(await prisma.identityReview.count({ where: { incomingSource: SOURCE } })).toBe(0);
  });

  it('cada envio de formulário é um registro de origem novo da mesma pessoa', async () => {
    const primeiro = await lead({ fullName: 'Elisa Brandão', email: 'elisa@form-teste.com' });
    const segundo = await lead({ fullName: 'Elisa Brandão', email: 'elisa@form-teste.com' });
    expect(segundo.personId).toBe(primeiro.personId);
    expect(await prisma.identityAlias.count({ where: { personId: primeiro.personId, source: SOURCE } })).toBe(2);
  });

  it('sincronização DentalGO: ficha com o ID do DentalGO é reaproveitada', async () => {
    const existente = await prisma.person.create({ data: { fullName: 'Fabiana Luz', externalPersonId: EXT[0], source: FATO } });
    const customer = await lead({ fullName: 'Fabiana Luz', email: 'fabiana@form-teste.com' }, { externalPersonId: EXT[0], source: 'API Sync (Cart)' });
    expect(customer.personId).toBe(existente.id);
    expect((await prisma.person.findUniqueOrThrow({ where: { id: existente.id } })).email).toBe('fabiana@form-teste.com');
  });

  it('sincronização DentalGO sem ficha pelo ID: usa e-mail/telefone e marca o ID', async () => {
    const bitrix = await prisma.person.create({ data: { fullName: 'Gustavo Reis', email: 'gustavo@form-teste.com', source: FATO } });
    const customer = await lead({ fullName: 'Gustavo Reis', email: 'gustavo@form-teste.com' }, { externalPersonId: EXT[1], source: 'API Sync (Cart)' });
    expect(customer.personId).toBe(bitrix.id);
    expect((await prisma.person.findUniqueOrThrow({ where: { id: bitrix.id } })).externalPersonId).toBe(EXT[1]);
  });
});

/**
 * Fusão de Persons sem perda de dados + resolução de casos ambíguos (ficha provisória).
 *
 * Antes: quando as duas pessoas tinham Customer na mesma jornada, o Customer redundante
 * era apagado e o banco removia em CASCATA, sem registro, audiência e matrículas de
 * campanha e execuções de fluxo.
 *
 * Requer Postgres descartável (DATABASE_URL), com as migrations aplicadas.
 */
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import prisma from '../prisma';
import { CanonicalIdentityService } from './CanonicalIdentityService';
import { IdentityMatchingService } from './IdentityMatchingService';

const SOURCE = 'MERGE_TEST';
const TESTER_EMAIL = 'merge-tester@teste.local';
let tester = '';

async function cleanup() {
  const persons = await prisma.person.findMany({ where: { source: SOURCE }, select: { id: true } });
  const personIds = persons.map(p => p.id);
  await prisma.identityReview.deleteMany({ where: { incomingSource: SOURCE } });
  await prisma.mergeEvent.deleteMany({ where: { reason: { startsWith: '[teste]' } } });
  await prisma.mergeEvent.deleteMany({ where: { OR: [{ sourcePersonId: { in: personIds } }, { targetPersonId: { in: personIds } }] } });
  await prisma.domainEvent.deleteMany({ where: { actorType: SOURCE } });
  await prisma.campaign.deleteMany({ where: { objective: SOURCE } });
  await prisma.person.deleteMany({ where: { source: SOURCE } }); // cascata limpa aliases, customers e filhos
  await prisma.journey.deleteMany({ where: { objective: SOURCE } });
  await prisma.pipeline.deleteMany({ where: { name: SOURCE } });
  await prisma.user.deleteMany({ where: { email: TESTER_EMAIL } });
}

describe.skipIf(!process.env.DATABASE_URL)('IdentityMatchingService — fusão segura', () => {
  beforeEach(async () => {
    await cleanup();
    tester = (await prisma.user.create({ data: { email: TESTER_EMAIL, name: 'Revisor de teste' } })).id;
  });
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  async function cenarioMesmaJornada() {
    const journey = await prisma.journey.create({ data: { name: 'Jornada teste', objective: SOURCE } });
    const pipeline = await prisma.pipeline.create({ data: { name: SOURCE } });
    const camp1 = await prisma.campaign.create({ data: { name: 'Campanha só da origem', objective: SOURCE } });
    const camp2 = await prisma.campaign.create({ data: { name: 'Campanha nas duas', objective: SOURCE } });

    const origem = await prisma.person.create({ data: { fullName: 'Douglas Costa', email: 'dc@teste.com', source: SOURCE } });
    const destino = await prisma.person.create({ data: { fullName: 'Douglas Henrique Costa', email: 'dhc@teste.com', source: SOURCE } });
    const custOrigem = await prisma.customer.create({ data: { personId: origem.id, journeyId: journey.id, source: SOURCE } });
    const custDestino = await prisma.customer.create({ data: { personId: destino.id, journeyId: journey.id, source: SOURCE } });

    await prisma.interaction.create({ data: { customerId: custOrigem.id, text: 'ligação' } });
    await prisma.task.create({ data: { customerId: custOrigem.id, scheduledFor: new Date(), taskType: 'CALL' } });
    await prisma.opportunity.create({ data: { customerId: custOrigem.id, pipelineId: pipeline.id } });
    await prisma.campaignAudienceMember.create({ data: { campaignId: camp1.id, customerId: custOrigem.id } });
    await prisma.campaignAudienceMember.create({ data: { campaignId: camp2.id, customerId: custOrigem.id } });
    await prisma.campaignAudienceMember.create({ data: { campaignId: camp2.id, customerId: custDestino.id } });
    await prisma.campaignEnrollment.create({ data: { campaignId: camp1.id, customerId: custOrigem.id } });
    await prisma.campaignEnrollment.create({ data: { campaignId: camp2.id, customerId: custOrigem.id } });
    await prisma.campaignEnrollment.create({ data: { campaignId: camp2.id, customerId: custDestino.id } });
    await prisma.domainEvent.create({ data: { type: 'TESTE', actorType: SOURCE, personId: origem.id, customerId: custOrigem.id } });

    return { origem, destino, custOrigem, custDestino, camp1, camp2 };
  }

  it('mesma jornada: move tudo para o destino, sem perda por cascata', async () => {
    const { origem, destino, custOrigem, custDestino, camp1 } = await cenarioMesmaJornada();

    const mergeEventId = await IdentityMatchingService.mergePersons(origem.id, destino.id, tester, '[teste] fusão');

    const to = { customerId: custDestino.id };
    expect(await prisma.person.findUnique({ where: { id: origem.id } })).toBeNull();
    expect(await prisma.customer.findUnique({ where: { id: custOrigem.id } })).toBeNull();
    expect(await prisma.interaction.count({ where: to })).toBe(1);
    expect(await prisma.task.count({ where: to })).toBe(1);
    expect(await prisma.opportunity.count({ where: to })).toBe(1);
    // Campanha só da origem foi MOVIDA; a que existia nos dois lados ficou com a do destino
    expect(await prisma.campaignAudienceMember.count({ where: to })).toBe(2);
    expect(await prisma.campaignEnrollment.count({ where: to })).toBe(2);
    expect(await prisma.campaignEnrollment.count({ where: { ...to, campaignId: camp1.id } })).toBe(1);
    const evento = await prisma.domainEvent.findFirst({ where: { actorType: SOURCE } });
    expect(evento?.personId).toBe(destino.id);
    expect(evento?.customerId).toBe(custDestino.id);

    // Registro para desfazer
    const merge = await prisma.mergeEvent.findUnique({ where: { id: mergeEventId } });
    const meta = merge?.metadata as any;
    expect(meta.version).toBe(2);
    expect(meta.sourcePerson.id).toBe(origem.id);
    expect(meta.mergedCustomers[0].sourceCustomer.id).toBe(custOrigem.id);
    expect(meta.mergedCustomers[0].droppedAudience).toHaveLength(1);
    expect(meta.mergedCustomers[0].droppedEnrollments).toHaveLength(1);
    expect(meta.mergedCustomers[0].moved.campaignEnrollment).toHaveLength(1);
  });

  it('jornadas diferentes: o Customer só muda de dono', async () => {
    const origem = await prisma.person.create({ data: { fullName: 'Eva Prado', source: SOURCE } });
    const destino = await prisma.person.create({ data: { fullName: 'Eva Prado', source: SOURCE } });
    const cust = await prisma.customer.create({ data: { personId: origem.id, source: SOURCE } });

    const id = await IdentityMatchingService.mergePersons(origem.id, destino.id, tester, '[teste] repoint');
    expect((await prisma.customer.findUnique({ where: { id: cust.id } }))?.personId).toBe(destino.id);
    expect(((await prisma.mergeEvent.findUnique({ where: { id } }))?.metadata as any).repointedCustomerIds).toEqual([cust.id]);
  });

  describe('caso ambíguo (ficha provisória)', () => {
    async function ambiguo() {
      const a = await CanonicalIdentityService.resolve({ source: SOURCE, externalId: 'a', email: 'gil@teste.com', name: 'Gil Rocha' });
      const b = await CanonicalIdentityService.resolve({ source: SOURCE, externalId: 'b', phone: '31988887777', name: 'Gil Rocha' });
      const provisoria = await CanonicalIdentityService.resolve({ source: SOURCE, externalId: 'c', email: 'gil@teste.com', phone: '31988887777', name: 'Gil Rocha' });
      const review = await prisma.identityReview.findFirstOrThrow({ where: { incomingSource: SOURCE, incomingExternalId: 'c' } });
      return { a, b, provisoria, review };
    }

    it('"É esta pessoa" (LINK) une a provisória à candidata escolhida e fecha a revisão', async () => {
      const { b, provisoria, review } = await ambiguo();
      await IdentityMatchingService.link(review.id, b.id, tester);

      expect(await prisma.person.findUnique({ where: { id: provisoria.id } })).toBeNull();
      const alias = await prisma.identityAlias.findUnique({ where: { source_externalId: { source: SOURCE, externalId: 'c' } } });
      expect(alias?.personId).toBe(b.id);
      const fechada = await prisma.identityReview.findUnique({ where: { id: review.id } });
      expect(fechada?.status).toBe('PROCESSED');
      expect(fechada?.decision).toBe('LINK');
      expect(await prisma.mergeEvent.count({ where: { sourcePersonId: provisoria.id, targetPersonId: b.id } })).toBe(1);
    });

    it('"É outra pessoa" (REJECT) mantém a provisória como ficha própria, sem criar outra', async () => {
      const { provisoria, review } = await ambiguo();
      const antes = await prisma.person.count({ where: { source: SOURCE } });
      const pessoa = await IdentityMatchingService.reject(review.id, tester);

      expect(pessoa.id).toBe(provisoria.id);
      expect(await prisma.person.count({ where: { source: SOURCE } })).toBe(antes);
      expect((await prisma.identityReview.findUnique({ where: { id: review.id } }))?.decision).toBe('REJECT');
    });

    it('não permite vincular a provisória a ela mesma', async () => {
      const { provisoria, review } = await ambiguo();
      await expect(IdentityMatchingService.link(review.id, provisoria.id, tester)).rejects.toThrow(/provisória/);
    });
  });
});

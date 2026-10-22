/**
 * Desfazer junção: a prévia não grava; o desfazer devolve tudo ao estado anterior
 * à junção e deixa trilha de auditoria. Requer Postgres descartável (DATABASE_URL).
 */
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import prisma from '../prisma';
import { AUDIT_REVIEW_SOURCE } from '../identity/reviewQueue';
import { IdentityMatchingService } from './IdentityMatchingService';
import { MergeUndoService } from './MergeUndoService';

const SOURCE = 'UNDO_TEST';
const TESTER_EMAIL = 'undo-tester@teste.local';
let tester = '';

async function cleanup() {
  await prisma.identityReview.deleteMany({ where: { OR: [{ incomingSource: SOURCE }, { incomingExternalId: { startsWith: 'undo-test:' } }] } });
  if (tester) await prisma.mergeEvent.deleteMany({ where: { decidedById: tester } });
  await prisma.domainEvent.deleteMany({ where: { OR: [{ actorType: SOURCE }, { actorId: tester || 'x', type: 'IDENTITY_MERGE_UNDONE' }] } });
  await prisma.campaign.deleteMany({ where: { objective: SOURCE } });
  await prisma.person.deleteMany({ where: { source: SOURCE } });
  await prisma.journey.deleteMany({ where: { objective: SOURCE } });
  await prisma.pipeline.deleteMany({ where: { name: SOURCE } });
  await prisma.user.deleteMany({ where: { email: TESTER_EMAIL } });
}

/** Fotografia de tudo que pertence às duas fichas, para comparar antes × depois. */
async function snapshot(origemId: string, destinoId: string, custOrigemId: string, custDestinoId: string) {
  const byCustomer = async (customerId: string) => ({
    interactions: await prisma.interaction.count({ where: { customerId } }),
    tasks: await prisma.task.count({ where: { customerId } }),
    opportunities: await prisma.opportunity.count({ where: { customerId } }),
    audience: (await prisma.campaignAudienceMember.findMany({ where: { customerId }, select: { campaignId: true } })).map(a => a.campaignId).sort(),
    enrollments: (await prisma.campaignEnrollment.findMany({ where: { customerId }, select: { campaignId: true, attribution: true } }))
      .map(e => `${e.campaignId}:${JSON.stringify(e.attribution)}`).sort(),
  });
  return {
    origem: await prisma.person.findUnique({ where: { id: origemId }, select: { id: true, fullName: true, email: true, source: true } }),
    destino: await prisma.person.findUnique({ where: { id: destinoId }, select: { id: true, fullName: true, email: true } }),
    aliasesOrigem: (await prisma.identityAlias.findMany({ where: { personId: origemId }, select: { id: true } })).map(a => a.id).sort(),
    aliasesDestino: (await prisma.identityAlias.findMany({ where: { personId: destinoId }, select: { id: true } })).map(a => a.id).sort(),
    custOrigem: await byCustomer(custOrigemId),
    custDestino: await byCustomer(custDestinoId),
    eventoPerson: (await prisma.domainEvent.findFirst({ where: { actorType: SOURCE } }))?.personId,
  };
}

async function cenario() {
  const journey = await prisma.journey.create({ data: { name: 'Jornada', objective: SOURCE } });
  const pipeline = await prisma.pipeline.create({ data: { name: SOURCE } });
  const camp1 = await prisma.campaign.create({ data: { name: 'Só da origem', objective: SOURCE } });
  const camp2 = await prisma.campaign.create({ data: { name: 'Nas duas', objective: SOURCE } });

  const origem = await prisma.person.create({
    data: {
      fullName: 'Nina Costa', email: 'nina@undo-teste.com', source: SOURCE,
      identityAliases: { create: [{ source: SOURCE, externalId: 'a1', name: 'Nina Costa' }, { source: SOURCE, externalId: 'a2', name: 'Nina C.' }] },
    },
  });
  const destino = await prisma.person.create({
    data: { fullName: 'Nina Costa Lopes', email: 'nina.lopes@undo-teste.com', source: SOURCE, identityAliases: { create: { source: SOURCE, externalId: 'b1' } } },
  });
  const custOrigem = await prisma.customer.create({ data: { personId: origem.id, journeyId: journey.id, source: SOURCE, metadata: { instagram: '@nina' } } });
  const custDestino = await prisma.customer.create({ data: { personId: destino.id, journeyId: journey.id, source: SOURCE } });
  const custOutraJornada = await prisma.customer.create({ data: { personId: origem.id, source: SOURCE } });

  await prisma.interaction.create({ data: { customerId: custOrigem.id, text: 'ligação' } });
  await prisma.task.create({ data: { customerId: custOrigem.id, scheduledFor: new Date(), taskType: 'CALL' } });
  await prisma.opportunity.create({ data: { customerId: custOrigem.id, pipelineId: pipeline.id } });
  await prisma.campaignAudienceMember.create({ data: { campaignId: camp1.id, customerId: custOrigem.id } });
  await prisma.campaignAudienceMember.create({ data: { campaignId: camp2.id, customerId: custOrigem.id } });
  await prisma.campaignAudienceMember.create({ data: { campaignId: camp2.id, customerId: custDestino.id } });
  await prisma.campaignEnrollment.create({ data: { campaignId: camp1.id, customerId: custOrigem.id, attribution: { utm: 'origem-1' } } });
  await prisma.campaignEnrollment.create({ data: { campaignId: camp2.id, customerId: custOrigem.id, attribution: { utm: 'origem-2' } } });
  await prisma.campaignEnrollment.create({ data: { campaignId: camp2.id, customerId: custDestino.id, attribution: { utm: 'destino' } } });
  await prisma.domainEvent.create({ data: { type: 'TESTE', actorType: SOURCE, personId: origem.id, customerId: custOrigem.id } });

  return { origem, destino, custOrigem, custDestino, custOutraJornada };
}

describe.skipIf(!process.env.DATABASE_URL)('MergeUndoService', () => {
  beforeEach(async () => {
    await cleanup();
    tester = (await prisma.user.create({ data: { email: TESTER_EMAIL, name: 'Revisor undo' } })).id;
  });
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  it('prévia não grava nada; desfazer devolve tudo ao estado anterior à junção', async () => {
    const c = await cenario();
    const ids = [c.origem.id, c.destino.id, c.custOrigem.id, c.custDestino.id] as const;
    const antes = await snapshot(...ids);

    const mergeId = await IdentityMatchingService.mergePersons(c.origem.id, c.destino.id, tester, '[undo-teste] junção');
    const depoisDaJuncao = await snapshot(...ids);
    expect(depoisDaJuncao.origem).toBeNull();

    // Prévia: relatório completo, banco intocado
    const preview = await MergeUndoService.preview(mergeId);
    expect(preview.restoredPersonId).toBe(c.origem.id);
    expect(preview.aliasesRestored).toBe(2);
    expect(preview.customersRepointed).toBe(1);
    expect(preview.customersRecreated).toBe(1);
    expect(preview.campaignRowsRecreated).toBe(2);
    expect(await snapshot(...ids)).toEqual(depoisDaJuncao);

    // Desfazer exige motivo
    await expect(MergeUndoService.undo(mergeId, tester, '')).rejects.toThrow(/motivo/);

    const report = await MergeUndoService.undo(mergeId, tester, 'Eram pessoas diferentes');
    expect(report).toEqual(preview);
    expect(await snapshot(...ids)).toEqual(antes);
    expect((await prisma.customer.findUnique({ where: { id: c.custOutraJornada.id } }))?.personId).toBe(c.origem.id);
    expect((await prisma.customer.findUnique({ where: { id: c.custOrigem.id } }))?.metadata).toEqual({ instagram: '@nina' });

    // Trilha de auditoria: a junção fica marcada e o desfazer vira evento
    const merge = await prisma.mergeEvent.findUnique({ where: { id: mergeId } });
    expect((merge?.metadata as any).undone).toMatchObject({ byUserId: tester, reason: 'Eram pessoas diferentes' });
    const evento = await prisma.domainEvent.findFirst({ where: { type: 'IDENTITY_MERGE_UNDONE', correlationId: mergeId } });
    expect(evento?.actorId).toBe(tester);

    // Não dá para desfazer duas vezes
    await expect(MergeUndoService.undo(mergeId, tester, 'de novo')).rejects.toThrow(/já foi desfeita/);
  });

  it('a revisão que originou a junção volta para a fila', async () => {
    const a = await prisma.person.create({ data: { fullName: 'Otto Lima', email: 'otto@undo-teste.com', source: SOURCE } });
    const b = await prisma.person.create({ data: { fullName: 'Otto Lima', email: 'otto@undo-teste.com', source: SOURCE } });
    const review = await prisma.identityReview.create({
      data: {
        incomingSource: AUDIT_REVIEW_SOURCE, incomingExternalId: `undo-test:${b.id}`, confidenceScore: 90, status: 'PENDING',
        evidences: ['KIND:MERGE_SUGGESTED', `KEEP:${a.id}`, `ABSORB:${b.id}`, 'BATCHABLE'],
      },
    });
    const { mergeEventId } = await IdentityMatchingService.resolveAuditReview(review.id, 'MERGE', tester);

    const report = await MergeUndoService.undo(mergeEventId!, tester, 'Teste de reabertura');
    expect(report.reviewReopened).toBe(review.id);
    const reaberta = await prisma.identityReview.findUnique({ where: { id: review.id } });
    expect(reaberta?.status).toBe('PENDING');
    expect(reaberta?.decision).toBeNull();
    await prisma.identityReview.delete({ where: { id: review.id } });
  });

  it('junções em cadeia: exige desfazer a mais recente primeiro', async () => {
    const a = await prisma.person.create({ data: { fullName: 'Paula Reis', source: SOURCE } });
    const b = await prisma.person.create({ data: { fullName: 'Paula Reis', source: SOURCE } });
    const c = await prisma.person.create({ data: { fullName: 'Paula Reis', source: SOURCE } });
    const primeira = await IdentityMatchingService.mergePersons(a.id, b.id, tester, '[undo-teste] a→b');
    const segunda = await IdentityMatchingService.mergePersons(b.id, c.id, tester, '[undo-teste] b→c');

    await expect(MergeUndoService.undo(primeira, tester, 'fora de ordem')).rejects.toThrow(/mais recente/);
    await MergeUndoService.undo(segunda, tester, 'desfaz a segunda');
    await MergeUndoService.undo(primeira, tester, 'agora a primeira');
    expect(await prisma.person.count({ where: { id: { in: [a.id, b.id, c.id] } } })).toBe(3);
  });

  it('dados canônicos sobrescritos voltam, exceto se alguém mudou depois', async () => {
    const a = await prisma.person.create({ data: { fullName: 'Rui Alves', email: 'rui@undo-teste.com', source: SOURCE } });
    const b = await prisma.person.create({ data: { fullName: 'Rui A.', email: 'rui.b@undo-teste.com', phoneNumber: '+5511900001111', source: SOURCE } });
    const mergeId = await IdentityMatchingService.mergePersons(a.id, b.id, tester, '[undo-teste] overrides', {
      fullName: 'Rui Alves Batista', email: 'rui@undo-teste.com',
    });
    await prisma.person.update({ where: { id: b.id }, data: { email: 'mudou.depois@undo-teste.com' } });

    const report = await MergeUndoService.undo(mergeId, tester, 'testando overrides');
    expect(report.canonicalFieldsRestored).toEqual(['fullName']);
    expect(report.warnings.some(w => w.includes('"email"'))).toBe(true);
    const destino = await prisma.person.findUniqueOrThrow({ where: { id: b.id } });
    expect(destino.fullName).toBe('Rui A.');
    expect(destino.email).toBe('mudou.depois@undo-teste.com');
  });

  it('junção antiga (sem registro completo) não é desfeita automaticamente', async () => {
    const legacy = await prisma.mergeEvent.create({
      data: { sourcePersonId: 'x', targetPersonId: 'y', decidedById: tester, reason: '[undo-teste] antiga', metadata: { sourcePerson: {} } },
    });
    await expect(MergeUndoService.preview(legacy.id)).rejects.toThrow(/anterior ao registro completo/);
  });
});

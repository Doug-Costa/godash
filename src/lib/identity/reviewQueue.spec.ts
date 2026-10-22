/**
 * Fila de revisão da auditoria: script de carga (simulação / --apply / idempotência)
 * e as decisões do admin. Requer Postgres descartável (DATABASE_URL) com migrations.
 */
import { execFile } from 'child_process';
import path from 'path';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import prisma from '../prisma';
import { IdentityMatchingService } from '../services/IdentityMatchingService';
import { AUDIT_REVIEW_SOURCE } from './reviewQueue';

const SOURCE = 'QUEUE_TEST';
const TESTER_EMAIL = 'queue-tester@teste.local';
const ROOT = path.resolve(__dirname, '../../..');
let tester = '';

async function cleanup() {
  await prisma.identityReview.deleteMany({ where: { incomingSource: AUDIT_REVIEW_SOURCE } });
  if (tester) await prisma.mergeEvent.deleteMany({ where: { decidedById: tester } });
  await prisma.person.deleteMany({ where: { source: { startsWith: SOURCE } } });
  await prisma.user.deleteMany({ where: { email: TESTER_EMAIL } });
}

function runLoader(apply: boolean): Promise<string> {
  const tsx = path.join(ROOT, 'node_modules/tsx/dist/cli.mjs');
  const script = path.join(ROOT, 'prisma/load-identity-review-queue.ts');
  return new Promise((resolve, reject) =>
    execFile(process.execPath, [tsx, script, ...(apply ? ['--apply'] : [])], { env: process.env, cwd: ROOT },
      (err, stdout, stderr) => (err ? reject(new Error(stderr || err.message)) : resolve(stdout))));
}

async function seed() {
  // Mesma pessoa (e-mail + nome): fica a DentalGO
  const dentalgo = await prisma.person.create({ data: { fullName: 'Hugo Matos', email: 'hugo@fila-teste.com', source: `${SOURCE}_DENTALGO` } });
  const bitrix = await prisma.person.create({ data: { fullName: 'Hugo Matos Filho', email: 'hugo@fila-teste.com', source: SOURCE } });
  // Telefone igual + nome compatível (lote) e e-mail de clínica (não lote)
  const tel1 = await prisma.person.create({ data: { fullName: 'Iara Nunes', phoneNumber: '+5531977778888', source: SOURCE } });
  const tel2 = await prisma.person.create({ data: { fullName: 'Iara Nunes Prado', phoneNumber: '+5531977778888', source: SOURCE } });
  const clin1 = await prisma.person.create({ data: { fullName: 'Joana Reis', email: 'contato@clinica-fila.com', source: SOURCE } });
  const clin2 = await prisma.person.create({ data: { fullName: 'Kleber Dias', email: 'contato@clinica-fila.com', source: SOURCE } });
  // Ficha misturada
  const mixed = await prisma.person.create({
    data: {
      fullName: 'Lia Campos', phoneNumber: '+5541966665555', source: SOURCE,
      identityAliases: { create: { source: `${SOURCE}_DEAL`, externalId: 'deal-1', name: 'Marcos Teles', phone: '+5541966665555' } },
    },
  });
  return { dentalgo, bitrix, tel1, tel2, clin1, clin2, mixed };
}

const reviewFor = (externalId: string) =>
  prisma.identityReview.findFirstOrThrow({ where: { incomingSource: AUDIT_REVIEW_SOURCE, incomingExternalId: externalId } });
const pairKey = (a: string, b: string) => `pair:${[a, b].sort().join(':')}`;

describe.skipIf(!process.env.DATABASE_URL)('fila de revisão da auditoria', () => {
  beforeEach(async () => {
    await cleanup();
    tester = (await prisma.user.create({ data: { email: TESTER_EMAIL, name: 'Revisor da fila' } })).id;
  });
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  it('carga: simulação não grava; --apply grava; rodar de novo não duplica', async () => {
    const s = await seed();
    const mine = async () => prisma.identityReview.count({
      where: { incomingSource: AUDIT_REVIEW_SOURCE, incomingExternalId: { in: [`merge:${s.bitrix.id}`, pairKey(s.tel1.id, s.tel2.id), pairKey(s.clin1.id, s.clin2.id), `mixed:${s.mixed.id}`] } },
    });

    const dry = await runLoader(false);
    expect(dry).toContain('SIMULAÇÃO');
    expect(await mine()).toBe(0);

    await runLoader(true);
    expect(await mine()).toBe(4);

    await runLoader(true);
    expect(await mine()).toBe(4);
    // Nenhuma ficha foi juntada nem separada pela carga
    expect(await prisma.person.count({ where: { id: { in: Object.values(s).map(p => p.id) } } })).toBe(7);
  }, 120000);

  it('juntar: a ficha sugerida fica, a outra é absorvida, revisão fechada', async () => {
    const s = await seed();
    await runLoader(true);
    const review = await reviewFor(`merge:${s.bitrix.id}`);

    const r = await IdentityMatchingService.resolveAuditReview(review.id, 'MERGE', tester);
    expect(r.outcome).toBe('MERGED');
    expect(await prisma.person.findUnique({ where: { id: s.bitrix.id } })).toBeNull();
    expect(await prisma.person.findUnique({ where: { id: s.dentalgo.id } })).not.toBeNull();
    expect((await prisma.identityReview.findUnique({ where: { id: review.id } }))?.decision).toBe('LINK');
  }, 120000);

  it('inverter qual fica, manter separadas e caso obsoleto', async () => {
    const s = await seed();
    await runLoader(true);
    const tel = await reviewFor(pairKey(s.tel1.id, s.tel2.id));
    const clin = await reviewFor(pairKey(s.clin1.id, s.clin2.id));

    // Escolhe explicitamente qual fica
    await IdentityMatchingService.resolveAuditReview(tel.id, 'MERGE', tester, s.tel2.id);
    expect(await prisma.person.findUnique({ where: { id: s.tel2.id } })).not.toBeNull();
    expect(await prisma.person.findUnique({ where: { id: s.tel1.id } })).toBeNull();

    // Ficha fora do par é recusada
    await expect(IdentityMatchingService.resolveAuditReview(clin.id, 'MERGE', tester, s.mixed.id)).rejects.toThrow(/uma das duas/);

    // Pessoas diferentes
    expect((await IdentityMatchingService.resolveAuditReview(clin.id, 'KEEP_SEPARATE', tester)).outcome).toBe('CLOSED');
    expect(await prisma.person.count({ where: { id: { in: [s.clin1.id, s.clin2.id] } } })).toBe(2);

    // Revisão cujas fichas já não existem fecha como obsoleta
    const obsolete = await prisma.identityReview.create({
      data: {
        incomingSource: AUDIT_REVIEW_SOURCE, incomingExternalId: 'pair:sumiu:tambem', confidenceScore: 50, status: 'PENDING',
        evidences: ['KIND:PAIR_REVIEW', 'KEEP:sumiu', 'ABSORB:tambem'],
      },
    });
    expect((await IdentityMatchingService.resolveAuditReview(obsolete.id, 'MERGE', tester)).outcome).toBe('OBSOLETE');
  }, 120000);

  it('lote: só processa os aprováveis em lote; o e-mail de clínica é recusado', async () => {
    const s = await seed();
    await runLoader(true);
    const merge = await reviewFor(`merge:${s.bitrix.id}`);
    const tel = await reviewFor(pairKey(s.tel1.id, s.tel2.id));
    const clin = await reviewFor(pairKey(s.clin1.id, s.clin2.id));

    const results = await IdentityMatchingService.resolveAuditReviewsBatch([merge.id, tel.id, clin.id], tester);
    const by = Object.fromEntries(results.map(r => [r.reviewId, r.outcome]));
    expect(by[merge.id]).toBe('MERGED');
    expect(by[tel.id]).toBe('MERGED');
    expect(by[clin.id]).toBe('SKIPPED');
    expect(await prisma.person.count({ where: { id: { in: [s.clin1.id, s.clin2.id] } } })).toBe(2);
  }, 120000);

  it('suspeita de ficha misturada: confirmar ou marcar para separar, sem separar nada', async () => {
    const s = await seed();
    await runLoader(true);
    const review = await reviewFor(`mixed:${s.mixed.id}`);

    await expect(IdentityMatchingService.resolveAuditReview(review.id, 'MERGE', tester)).rejects.toThrow();
    await IdentityMatchingService.resolveAuditReview(review.id, 'NEEDS_SPLIT', tester);
    const marked = await prisma.identityReview.findUnique({ where: { id: review.id } });
    expect(marked?.status).toBe('DEFERRED');
    expect(marked?.decision).toBe('SPLIT_NEEDED');
    expect(await prisma.identityAlias.count({ where: { personId: s.mixed.id } })).toBe(1);

    // Revisões da auditoria não aceitam as ações antigas (vínculo de alias)
    await expect(IdentityMatchingService.link(review.id, s.mixed.id, tester)).rejects.toThrow();
  }, 120000);
});

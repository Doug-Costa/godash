/**
 * Regressão dos 4 defeitos que multiplicaram Persons nas importações (Bitrix/CSV):
 *  1. corrida entre chamadas simultâneas (no mesmo processo e entre processos)
 *  2. e-mail aponta para A e telefone para B → criava uma 3ª ficha em silêncio
 *  3. cascata: com 2 fichas no mesmo e-mail, cada entrada nova criava outra
 *  4. e-mail secundário / de alias era ignorado na busca
 *
 * Requer Postgres descartável (DATABASE_URL), com as migrations aplicadas.
 */
import { execFile } from 'child_process';
import path from 'path';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import prisma from '../prisma';
import { AMBIGUOUS_PROVISIONAL, CanonicalIdentityService } from './CanonicalIdentityService';

const SOURCE = 'LEAK_TEST';

async function cleanup() {
  await prisma.identityReview.deleteMany({ where: { incomingSource: SOURCE } });
  await prisma.identityAlias.deleteMany({ where: { OR: [{ source: SOURCE }, { person: { source: SOURCE } }] } });
  await prisma.person.deleteMany({ where: { source: SOURCE } });
}

const personsWithEmail = (email: string) =>
  prisma.person.count({ where: { OR: [{ email }, { identityAliases: { some: { email } } }] } });

describe.skipIf(!process.env.DATABASE_URL)('CanonicalIdentityService — vazamento de duplicatas', () => {
  beforeEach(cleanup);
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  it('1a. 20 chamadas simultâneas no mesmo processo criam UMA Person', async () => {
    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        CanonicalIdentityService.resolve({ source: SOURCE, externalId: `deal_${i}`, email: 'ana.lima@teste.com', name: 'Ana Lima' })),
    );
    expect(new Set(results.map(p => p.id)).size).toBe(1);
    expect(await prisma.person.count({ where: { source: SOURCE } })).toBe(1);
    expect(await prisma.identityAlias.count({ where: { source: SOURCE } })).toBe(20);
  });

  it('1b. 4 processos separados ao mesmo tempo criam UMA Person', async () => {
    const worker = path.join(__dirname, '__fixtures__', 'resolveInChildProcess.ts');
    const tsx = path.resolve(__dirname, '../../../node_modules/tsx/dist/cli.mjs');
    const startAt = String(Date.now() + 4000); // todos disparam no mesmo instante

    const ids = await Promise.all(
      Array.from({ length: 4 }, (_, i) => new Promise<string>((resolve, reject) => {
        execFile(process.execPath, [tsx, worker, startAt, `proc_${i}`, 'bia.nunes@teste.com', 'Beatriz Nunes'],
          { env: process.env, cwd: path.resolve(__dirname, '../../..') },
          (err, stdout, stderr) => (err ? reject(new Error(stderr || err.message)) : resolve(stdout.trim().split('\n').pop()!.trim())));
      })),
    );
    expect(new Set(ids).size).toBe(1);
    expect(await prisma.person.count({ where: { source: SOURCE } })).toBe(1);
  }, 60000);

  it('2. e-mail → A e telefone → B: NÃO funde, isola numa provisória e abre revisão', async () => {
    const a = await CanonicalIdentityService.resolve({ source: SOURCE, externalId: 'csv_a', email: 'bruno.reis@teste.com', name: 'Bruno Reis' });
    const b = await CanonicalIdentityService.resolve({ source: SOURCE, externalId: 'csv_b', phone: '44991234567', name: 'Bruno Reis' });
    const novo = await CanonicalIdentityService.resolve({ source: SOURCE, externalId: 'bitrix_1', email: 'bruno.reis@teste.com', phone: '44991234567', name: 'Bruno Reis' });

    expect(novo.id).not.toBe(a.id);
    expect(novo.id).not.toBe(b.id);
    // A e B continuam intactos: nenhum alias novo foi ligado a eles
    expect(await prisma.identityAlias.count({ where: { personId: a.id } })).toBe(1);
    expect(await prisma.identityAlias.count({ where: { personId: b.id } })).toBe(1);

    const review = await prisma.identityReview.findFirst({ where: { incomingSource: SOURCE, incomingExternalId: 'bitrix_1' } });
    expect(review?.status).toBe('PENDING');
    expect(review?.evidences).toEqual(expect.arrayContaining([
      AMBIGUOUS_PROVISIONAL, `PROVISIONAL_PERSON:${novo.id}`, `CANDIDATE:${a.id}`, `CANDIDATE:${b.id}`,
    ]));
  });

  it('3. cascata interrompida: entradas seguintes reutilizam a provisória', async () => {
    await CanonicalIdentityService.resolve({ source: SOURCE, externalId: 'csv_a', email: 'carla.dias@teste.com', name: 'Carla Dias' });
    await CanonicalIdentityService.resolve({ source: SOURCE, externalId: 'csv_b', phone: '11987654321', name: 'Carla Dias' });
    const provisoria = await CanonicalIdentityService.resolve({ source: SOURCE, externalId: 'bitrix_1', email: 'carla.dias@teste.com', phone: '11987654321', name: 'Carla Dias' });

    const depois = [];
    for (let i = 0; i < 5; i++) {
      depois.push(await CanonicalIdentityService.resolve({ source: SOURCE, externalId: `bitrix_cascata_${i}`, email: 'carla.dias@teste.com', name: 'Carla Dias' }));
    }
    expect(depois.every(p => p.id === provisoria.id)).toBe(true);
    expect(await prisma.person.count({ where: { source: SOURCE } })).toBe(3); // A, B e a provisória — antes eram 8
    expect(await prisma.identityReview.count({ where: { incomingSource: SOURCE } })).toBe(1);
  });

  it('4. e-mail secundário e e-mail de alias são encontrados', async () => {
    const carla = await prisma.person.create({
      data: { fullName: 'Carla Souza', email: 'carla@clinica-teste.com', secondaryEmail: 'carla.souza@teste.com', source: SOURCE },
    });
    const viaSecundario = await CanonicalIdentityService.resolve({ source: SOURCE, externalId: 'bitrix_sec', email: 'Carla.Souza@teste.com', name: 'Carla Souza' });
    expect(viaSecundario.id).toBe(carla.id);

    const viaAlias = await CanonicalIdentityService.resolve({ source: SOURCE, externalId: 'form_1', email: 'carla.souza@teste.com', name: 'Carla Souza' });
    expect(viaAlias.id).toBe(carla.id);
    expect(await prisma.person.count({ where: { source: SOURCE } })).toBe(1);
  });

  it('inspect() (preflight) acompanha as mesmas regras e não grava nada', async () => {
    await CanonicalIdentityService.resolve({ source: SOURCE, externalId: 'csv_a', email: 'davi@teste.com', name: 'Davi Melo' });
    await CanonicalIdentityService.resolve({ source: SOURCE, externalId: 'csv_b', phone: '21977776666', name: 'Davi Melo' });
    const antes = await prisma.person.count({ where: { source: SOURCE } });

    const r = await CanonicalIdentityService.inspect({ source: SOURCE, externalId: 'x', email: 'davi@teste.com', phone: '21977776666' });
    expect(r.status).toBe('AMBIGUOUS');
    expect(await prisma.person.count({ where: { source: SOURCE } })).toBe(antes);
  });

  it('caso simples continua igual: um candidato por e-mail → mesmo Person', async () => {
    const a = await CanonicalIdentityService.resolve({ source: SOURCE, externalId: 'csv_1', email: 'eva@teste.com', name: 'Eva Prado' });
    const b = await CanonicalIdentityService.resolve({ source: SOURCE, externalId: 'bitrix_1', email: 'EVA@teste.com', name: 'Eva Prado' });
    expect(b.id).toBe(a.id);
    expect(await personsWithEmail('eva@teste.com')).toBe(1);
  });
});

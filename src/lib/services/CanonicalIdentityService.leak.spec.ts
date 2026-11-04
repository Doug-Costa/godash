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

  it('ficha "Contato Sem Nome" (Bitrix): mesmo e-mail de outra origem vai para revisão; a própria origem completa o nome', async () => {
    const semNome = await CanonicalIdentityService.resolve({ source: SOURCE, externalId: 'bitrix_x', email: 'fabio@teste.com', name: 'Contato Sem Nome' });
    expect(semNome.fullName).toBe('Contato Sem Nome');

    // Outra origem com o mesmo e-mail: sem nome na ficha para confirmar → revisão, não junta
    const outra = await CanonicalIdentityService.resolve({ source: SOURCE, externalId: 'csv_x', email: 'fabio@teste.com', name: 'Fábio Torres' });
    expect(outra.id).not.toBe(semNome.id);
    const review = await prisma.identityReview.findFirst({ where: { incomingSource: SOURCE, incomingExternalId: 'csv_x' } });
    expect(review?.evidences).toEqual(expect.arrayContaining(['REASON:Mesmo e-mail, mas sem nome para confirmar', `CANDIDATE:${semNome.id}`]));

    // A mesma origem trazendo o nome real completa a ficha genérica
    const completada = await CanonicalIdentityService.resolve({ source: SOURCE, externalId: 'bitrix_x', email: 'fabio@teste.com', name: 'Fábio Torres' });
    expect(completada.id).toBe(semNome.id);
    expect(completada.fullName).toBe('Fábio Torres');
  });

  describe('um único candidato: as regras decidem (antes juntava por qualquer contato igual)', () => {
    const reviewOf = (externalId: string) =>
      prisma.identityReview.findFirst({ where: { incomingSource: SOURCE, incomingExternalId: externalId } });

    it('mesmo telefone, nome compatível → NÃO junta; ficha provisória + revisão', async () => {
      const a = await CanonicalIdentityService.resolve({ source: SOURCE, externalId: 'csv_t', phone: '41988887777', name: 'Gabriel Souza' });
      const b = await CanonicalIdentityService.resolve({ source: SOURCE, externalId: 'bitrix_t', phone: '+5541988887777', name: 'Gabriel Souza Lima' });
      expect(b.id).not.toBe(a.id);
      const review = await reviewOf('bitrix_t');
      expect(review?.status).toBe('PENDING');
      expect(review?.evidences).toEqual(expect.arrayContaining([
        'AMBIGUOUS_PROVISIONAL', `PROVISIONAL_PERSON:${b.id}`, `CANDIDATE:${a.id}`, 'PHONE_EXACT', 'NAME_COMPATIBLE',
        'REASON:Mesmo telefone — confirmar se é a mesma pessoa',
      ]));
      // A ficha existente não recebe o alias novo
      expect(await prisma.identityAlias.count({ where: { personId: a.id } })).toBe(1);
    });

    it('e-mail da clínica com outra pessoa → NÃO junta; revisão', async () => {
      const maria = await CanonicalIdentityService.resolve({ source: SOURCE, externalId: 'csv_m', email: 'contato@clinica-leak.com', name: 'Maria Silva' });
      const joao = await CanonicalIdentityService.resolve({ source: SOURCE, externalId: 'form_j', email: 'contato@clinica-leak.com', name: 'João Pereira' });
      expect(joao.id).not.toBe(maria.id);
      expect((await reviewOf('form_j'))?.evidences).toEqual(expect.arrayContaining(['NAME_INCOMPATIBLE', 'EMAIL_EXACT']));
    });

    it('CPF diferente bloqueia a junção mesmo com e-mail e nome iguais', async () => {
      const a = await CanonicalIdentityService.resolve({ source: SOURCE, externalId: 'csv_c', email: 'helio@teste.com', name: 'Hélio Dias', cpf: '529.982.247-25' });
      const b = await CanonicalIdentityService.resolve({ source: SOURCE, externalId: 'bitrix_c', email: 'helio@teste.com', name: 'Hélio Dias', cpf: '111.444.777-35' });
      expect(b.id).not.toBe(a.id);
      expect((await reviewOf('bitrix_c'))?.evidences).toEqual(expect.arrayContaining(['CPF_DIFFERENT']));
      expect(a.cpf).toBe('52998224725'); // CPF da entrada é gravado na ficha
    });

    it('só um telefone fictício em comum → ficha nova, sem revisão', async () => {
      const a = await CanonicalIdentityService.resolve({ source: SOURCE, externalId: 'csv_d', phone: '(11) 99999-9999', name: 'Igor Melo' });
      const b = await CanonicalIdentityService.resolve({ source: SOURCE, externalId: 'csv_e', phone: '11999999999', name: 'Júlia Reis' });
      expect(b.id).not.toBe(a.id);
      expect(await reviewOf('csv_e')).toBeNull();
    });

    it('nova entrada do mesmo caso pendente se junta à provisória (sem cascata)', async () => {
      await CanonicalIdentityService.resolve({ source: SOURCE, externalId: 'csv_k', phone: '31977776666', name: 'Karla Nunes' });
      const prov = await CanonicalIdentityService.resolve({ source: SOURCE, externalId: 'bitrix_k1', phone: '31977776666', name: 'Karla Nunes Prado' });
      const de_novo = await CanonicalIdentityService.resolve({ source: SOURCE, externalId: 'bitrix_k2', phone: '31977776666', name: 'Karla Nunes Prado' });
      expect(de_novo.id).toBe(prov.id);
      expect(await prisma.person.count({ where: { phoneNumber: '+5531977776666' } })).toBe(2);
    });

    it('preflight (inspect) prevê a revisão em vez de "encontrado"', async () => {
      await CanonicalIdentityService.resolve({ source: SOURCE, externalId: 'csv_p', phone: '51966665555', name: 'Lucas Prado' });
      const r = await CanonicalIdentityService.inspect({ source: SOURCE, externalId: 'novo_p', phone: '51966665555', name: 'Lucas Prado' });
      expect(r.status).toBe('AMBIGUOUS');
    });
  });

  it('caso simples continua igual: um candidato por e-mail → mesmo Person', async () => {
    const a = await CanonicalIdentityService.resolve({ source: SOURCE, externalId: 'csv_1', email: 'eva@teste.com', name: 'Eva Prado' });
    const b = await CanonicalIdentityService.resolve({ source: SOURCE, externalId: 'bitrix_1', email: 'EVA@teste.com', name: 'Eva Prado' });
    expect(b.id).toBe(a.id);
    expect(await personsWithEmail('eva@teste.com')).toBe(1);
  });
});

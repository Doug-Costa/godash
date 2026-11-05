import { describe, expect, it } from 'vitest';
import type { DentalGoInspection } from '../services/CanonicalIdentityService';
import { DentalGoSyncSimulation, type DentalGoPersonRow } from './dentalGoSyncSimulation';
import { genericPhonesFromCounts, isIgnoredPhone } from './genericPhones';
import { canJoinProvisional, matchIdentities, MULTI_CANDIDATE_REASON, OTHER_DENTALGO_ACCOUNT_REASON } from './matchRules';

const row = (id: number, fullName: string, email: string | null, phoneNumber: string | null = null): DentalGoPersonRow =>
  ({ id, fullName, email, phoneNumber, cpf: null });

const NEW: DentalGoInspection = { outcome: 'NEW', reason: 'NO_CANDIDATE' };

describe('telefones genéricos', () => {
  it('soma formatos diferentes do mesmo número e aplica o limite', () => {
    const set = genericPhonesFromCounts([
      { phone: '41999990000', n: 3 }, { phone: '5541999990000', n: 2 }, // mesmo número: 5 contas
      { phone: '11988887777', n: 4 },
    ]);
    expect([...set]).toEqual(['+5541999990000']);
  });

  it('fictício, genérico e inválido não contam; número comum conta', () => {
    const generic = new Set(['+5541999990000']);
    expect(isIgnoredPhone('(41) 99999-0000', generic)).toBe(true);
    expect(isIgnoredPhone('11 99999-9999', generic)).toBe(true); // fictício por padrão
    expect(isIgnoredPhone('123', generic)).toBe(true);
    expect(isIgnoredPhone('11 98765-1234', generic)).toBe(false);
  });
});

describe('canJoinProvisional', () => {
  const prov = { names: ['Karla Nunes Prado'], emails: ['karla@x.com'], phones: ['+5531977776666'] };
  it('mesma pessoa (mesmo telefone, nome compatível, sem e-mail diferente) entra na provisória', () => {
    const inc = { names: ['Karla Nunes Prado'], emails: [], phones: ['+5531977776666'] };
    expect(canJoinProvisional(matchIdentities(inc, prov), null, prov)).toBe(true);
  });
  it('outra conta com e-mail diferente NÃO entra, mesmo com nome compatível', () => {
    const inc = { names: ['Karla Nunes'], emails: ['outra@x.com'], phones: ['+5531977776666'] };
    expect(canJoinProvisional(matchIdentities(inc, prov), 'outra@x.com', prov)).toBe(false);
  });
  it('nome muito diferente NÃO entra', () => {
    const inc = { names: ['Roberto Lima'], emails: [], phones: ['+5531977776666'] };
    expect(canJoinProvisional(matchIdentities(inc, prov), null, prov)).toBe(false);
  });
});

describe('DentalGoSyncSimulation', () => {
  it('conta resultados e erros contra o CRM de hoje', async () => {
    const answers: Record<number, DentalGoInspection> = {
      1: { outcome: 'LINKED_BY_ID', personId: 'p1' },
      2: { outcome: 'WOULD_LINK', personId: 'p2' },
      3: { outcome: 'REVIEW', reason: 'Mesmo telefone — confirmar se é a mesma pessoa', candidates: 1 },
      4: { outcome: 'NEW', reason: 'DISTINCT' },
      5: { outcome: 'LINKED_BY_ALIAS', personId: 'p5', personHasOtherDentalGoId: true },
    };
    const sim = new DentalGoSyncSimulation(async r => {
      if (r.id === 6) throw new Error('falha');
      return answers[r.id];
    }, new Set(), 2, 3);
    await sim.addBatch([row(1, 'A', 'a@x.com'), row(2, 'B', 'b@x.com'), row(3, 'C', 'c@x.com')]);
    await sim.addBatch([row(4, 'D', 'd@x.com'), row(5, 'E', 'e@x.com'), row(6, 'F', 'f@x.com')]);
    const s = sim.finish();

    expect(s.total).toBe(6);
    expect(s.errors).toBe(1);
    expect(s.outcomes).toEqual({ LINKED_BY_ID: 1, LINKED_BY_ALIAS: 1, WOULD_LINK: 1, WOULD_JOIN_PROVISIONAL: 0, REVIEW: 1, NEW: 1 });
    expect(s.newByReason).toEqual({ NO_CANDIDATE: 0, DISTINCT: 1 });
    expect(s.linkedToPersonWithOtherDentalGoId).toBe(1);
    expect(s.reviewsBetweenDentalGoAccounts).toBe(0);
    expect(s.samples.get('WOULD_LINK')).toEqual([2]);
  });

  it('contas comparadas entre si: 3 contas no mesmo telefone com e-mails diferentes → 1 ficha nova + 2 revisões, ninguém junta', async () => {
    const sim = new DentalGoSyncSimulation(async () => NEW);
    await sim.addBatch([
      row(10, 'Paula Reis', 'paula@x.com', '11 98765-1234'),
      row(11, 'Paula Reis Lima', 'paula.lima@x.com', '11987651234'),
      row(12, 'Carlos Reis', 'carlos@x.com', '+55 11 98765-1234'),
    ]);
    const s = sim.finish();
    expect(s.outcomes.NEW).toBe(1);
    expect(s.outcomes.REVIEW).toBe(2);
    expect(s.outcomes.WOULD_JOIN_PROVISIONAL).toBe(0);
    expect(s.reviewsBetweenDentalGoAccounts).toBe(2);
    expect(s.reviewReasons.get('Mesmo telefone — confirmar se é a mesma pessoa')).toBe(1);
    expect(s.reviewReasons.get(MULTI_CANDIDATE_REASON)).toBe(1);
    expect(s.accountsSharingPhone).toBe(3);
    expect(s.samples.get('REVIEW:ENTRE_CONTAS')).toEqual([11, 12]);
  });

  it('telefone genérico não compara: 3 contas no número genérico → 3 fichas novas, sem revisão', async () => {
    const sim = new DentalGoSyncSimulation(async () => NEW, new Set(['+5541999990000']));
    await sim.addBatch([
      row(20, 'Ana', 'ana@x.com', '41 99999-0000'),
      row(21, 'Bia', 'bia@x.com', '41999990000'),
      row(22, 'Caio', 'caio@x.com', '41999990000'),
    ]);
    const s = sim.finish();
    expect(s.outcomes.NEW).toBe(3);
    expect(s.outcomes.REVIEW).toBe(0);
    expect(s.genericPhones).toBe(1);
    expect(s.accountsSharingPhone).toBe(0);
  });

  it('duas contas do DentalGO que juntariam à mesma ficha do CRM: a segunda vai para revisão', async () => {
    const sim = new DentalGoSyncSimulation(async () => ({ outcome: 'WOULD_LINK', personId: 'crm1' }));
    await sim.addBatch([row(30, 'Rui Alves', 'rui@x.com'), row(31, 'Rui Alves', 'rui2@x.com')]);
    const s = sim.finish();
    expect(s.outcomes.WOULD_LINK).toBe(1);
    expect(s.outcomes.REVIEW).toBe(1);
    expect(s.reviewReasons.get(OTHER_DENTALGO_ACCOUNT_REASON)).toBe(1);
  });
});

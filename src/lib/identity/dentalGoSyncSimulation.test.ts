import { describe, expect, it } from 'vitest';
import type { DentalGoInspection } from '../services/CanonicalIdentityService';
import { DentalGoSyncSimulation, type DentalGoPersonRow } from './dentalGoSyncSimulation';

const row = (id: number, email: string | null, phoneNumber: string | null = null): DentalGoPersonRow =>
  ({ id, fullName: 'X', email, phoneNumber, cpf: null });

describe('DentalGoSyncSimulation', () => {
  it('conta resultados, motivos, pontos de atenção e contas que dividem contato', async () => {
    const answers: Record<number, DentalGoInspection> = {
      1: { outcome: 'LINKED_BY_ID', personId: 'p1' },
      2: { outcome: 'WOULD_LINK', personId: 'p2', personHasOtherDentalGoId: false },
      3: { outcome: 'WOULD_LINK', personId: 'p2', personHasOtherDentalGoId: true },
      4: { outcome: 'REVIEW', reason: 'Mesmo telefone — confirmar se é a mesma pessoa', candidates: 1 },
      5: { outcome: 'NEW', reason: 'NO_CANDIDATE' },
      6: { outcome: 'NEW', reason: 'DISTINCT' },
    };
    const sim = new DentalGoSyncSimulation(async r => {
      if (r.id === 7) throw new Error('falha');
      return answers[r.id];
    }, 2, 3);

    await sim.addBatch([row(1, 'a@x.com'), row(2, 'B@x.com', '11 99999-0000'), row(3, 'b@x.com'), row(4, 'c@x.com', '11999990000')]);
    await sim.addBatch([row(5, 'd@x.com'), row(6, 'e@x.com'), row(7, 'f@x.com')]);
    const s = sim.finish();

    expect(s.total).toBe(7);
    expect(s.errors).toBe(1);
    expect(s.outcomes).toEqual({ LINKED_BY_ID: 1, LINKED_BY_ALIAS: 0, WOULD_LINK: 2, WOULD_JOIN_PROVISIONAL: 0, REVIEW: 1, NEW: 2 });
    expect(s.newByReason).toEqual({ NO_CANDIDATE: 1, DISTINCT: 1 });
    expect(s.reviewReasons.get('Mesmo telefone — confirmar se é a mesma pessoa')).toBe(1);
    expect(s.linkedToPersonWithOtherDentalGoId).toBe(1);
    expect(s.crmPersonsReceivingSeveralAccounts).toBe(1); // p2 recebe as contas 2 e 3
    expect(s.accountsSharingEmail).toBe(2);               // b@x.com (maiúsculas não contam)
    expect(s.accountsSharingPhone).toBe(2);               // mesmo telefone em formatos diferentes
    expect(s.samples.get('WOULD_LINK')).toEqual([2, 3]);
    expect(s.samples.get('NEW:DISTINCT')).toEqual([6]);
  });
});

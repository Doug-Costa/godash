import { describe, expect, it } from 'vitest';
import type { DentalGoInspection } from '../services/CanonicalIdentityService';
import { runDentalGoSync, type SyncDeps } from './dentalGoSync';
import type { DentalGoPersonRow } from './dentalGoSyncSimulation';

const rows = (ids: number[]): DentalGoPersonRow[] => ids.map(id => ({ id, fullName: `P${id}`, email: `p${id}@x.com`, phoneNumber: null, cpf: null }));

function fake(ids: number[], opts: { fail?: Set<number>; wrong?: Set<number>; inspect?: (id: number) => DentalGoInspection } = {}) {
  const all = rows(ids);
  const resolved: number[] = [];
  const pages: number[] = [];
  const deps: SyncDeps = {
    fetchPage: async (afterId, take) => {
      pages.push(afterId);
      return all.filter(r => r.id > afterId).slice(0, take);
    },
    inspect: async r => opts.inspect?.(r.id) ?? { outcome: 'NEW', reason: 'NO_CANDIDATE' },
    resolve: async r => {
      if (opts.fail?.has(r.id)) throw Object.assign(new Error('Unique constraint failed\nvalor: fulano@x.com'), { code: 'P2002' });
      resolved.push(r.id);
      return { id: `p${r.id}`, externalPersonId: opts.wrong?.has(r.id) ? 999 : r.id };
    },
  };
  return { deps, resolved, pages };
}

describe('runDentalGoSync', () => {
  it('grava em ordem de ID, em páginas, e conta os resultados previstos', async () => {
    const f = fake([1, 2, 3, 4, 5], {
      inspect: id => (id === 2 ? { outcome: 'WOULD_LINK', personId: 'p2' } : id === 3 ? { outcome: 'REVIEW', reason: 'Mesmo telefone', candidates: 1 } : { outcome: 'NEW', reason: 'NO_CANDIDATE' }),
    });
    const s = await runDentalGoSync(f.deps, { pageSize: 2 });
    expect(f.resolved).toEqual([1, 2, 3, 4, 5]);
    expect(f.pages).toEqual([0, 2, 4, 5]);
    expect(s).toMatchObject({ processed: 5, firstId: 1, lastId: 5, resumeFromId: 5, errorCount: 0, mismatchCount: 0 });
    expect(s.outcomes).toMatchObject({ NEW: 3, WOULD_LINK: 1, REVIEW: 1 });
    expect(s.reviewReasons).toEqual({ 'Mesmo telefone': 1 });
  });

  it('respeita --limit e --from-id', async () => {
    const f = fake([1, 2, 3, 4, 5, 6]);
    const s = await runDentalGoSync(f.deps, { fromId: 2, limit: 3, pageSize: 2 });
    expect(f.resolved).toEqual([3, 4, 5]);
    expect(s.resumeFromId).toBe(5);
  });

  it('erro numa conta: segue para as próximas, mas a retomada volta para antes dela', async () => {
    const f = fake([1, 2, 3, 4], { fail: new Set([2]) });
    const s = await runDentalGoSync(f.deps);
    expect(f.resolved).toEqual([1, 3, 4]);
    expect(s.errorCount).toBe(1);
    expect(s.resumeFromId).toBe(1);
    // Mensagem curta, sem os dados da pessoa que o banco às vezes inclui
    expect(s.errors).toEqual([{ id: 2, message: 'P2002 Unique constraint failed' }]);
  });

  it('muitas contas seguidas com erro (banco fora do ar): interrompe', async () => {
    const f = fake([1, 2, 3, 4, 5, 6], { fail: new Set([2, 3, 4, 5, 6]) });
    const s = await runDentalGoSync(f.deps, { maxConsecutiveErrors: 3 });
    expect(s.processed).toBe(4);
    expect(s.aborted).toMatch(/3 contas seguidas/);
    expect(s.resumeFromId).toBe(1);
  });

  it('ficha gravada diferente da prevista vira divergência', async () => {
    const f = fake([1, 2, 3], {
      wrong: new Set([2]),
      inspect: id => (id === 3 ? { outcome: 'WOULD_LINK', personId: 'outra' } : { outcome: 'NEW', reason: 'NO_CANDIDATE' }),
    });
    const s = await runDentalGoSync(f.deps);
    expect(s.mismatchCount).toBe(2);
    expect(s.mismatches).toEqual([2, 3]);
  });

  it('pedido de parada termina a conta atual e para', async () => {
    const f = fake([1, 2, 3, 4]);
    let stop = false;
    const deps = { ...f.deps, resolve: async (r: DentalGoPersonRow) => { if (r.id === 2) stop = true; return f.deps.resolve(r); }, shouldStop: () => stop };
    const s = await runDentalGoSync(deps);
    expect(f.resolved).toEqual([1, 2]);
    expect(s.resumeFromId).toBe(2);
  });
});

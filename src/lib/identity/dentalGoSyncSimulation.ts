/**
 * Simulação da sincronização da base do DentalGO (MySQL `people`) com as fichas do CRM.
 * Só conta — nunca grava. A decisão de cada pessoa vem de
 * CanonicalIdentityService.inspectDentalGoPerson(), o mesmo caminho da gravação.
 */
import type { DentalGoInspection } from '../services/CanonicalIdentityService';
import { normalizeEmail, normalizePhone } from './matchRules';

export interface DentalGoPersonRow {
  id: number;
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
  cpf: string | null;
}

export type Inspect = (row: DentalGoPersonRow) => Promise<DentalGoInspection>;

export interface SimulationSummary {
  total: number;
  outcomes: Record<DentalGoInspection['outcome'], number>;
  newByReason: Record<'NO_CANDIDATE' | 'DISTINCT', number>;
  reviewReasons: Map<string, number>;
  /** Juntaria (ou já está ligada) a uma ficha que tem OUTRO ID do DentalGO: duas contas, mesma pessoa? */
  linkedToPersonWithOtherDentalGoId: number;
  /** Fichas do CRM que receberiam 2+ contas do DentalGO nesta mesma sincronização. */
  crmPersonsReceivingSeveralAccounts: number;
  /** Contas do DentalGO que dividem e-mail / telefone com outra conta do DentalGO. */
  accountsSharingEmail: number;
  accountsSharingPhone: number;
  /** Até N IDs do DentalGO por resultado, para conferência manual. */
  samples: Map<string, number[]>;
  errors: number;
}

export function emptySummary(): SimulationSummary {
  return {
    total: 0,
    outcomes: { LINKED_BY_ID: 0, LINKED_BY_ALIAS: 0, WOULD_LINK: 0, WOULD_JOIN_PROVISIONAL: 0, REVIEW: 0, NEW: 0 },
    newByReason: { NO_CANDIDATE: 0, DISTINCT: 0 },
    reviewReasons: new Map(),
    linkedToPersonWithOtherDentalGoId: 0,
    crmPersonsReceivingSeveralAccounts: 0,
    accountsSharingEmail: 0,
    accountsSharingPhone: 0,
    samples: new Map(),
    errors: 0,
  };
}

/** Acumulador: alimente com lotes de pessoas; chame finish() no fim. */
export class DentalGoSyncSimulation {
  readonly summary = emptySummary();
  private readonly emails = new Map<string, number>();
  private readonly phones = new Map<string, number>();
  private readonly linkTargets = new Map<string, number>();

  constructor(private readonly inspect: Inspect, private readonly sampleSize = 10, private readonly concurrency = 8) {}

  async addBatch(rows: DentalGoPersonRow[]): Promise<void> {
    for (const row of rows) {
      const e = normalizeEmail(row.email);
      if (e) this.emails.set(e, (this.emails.get(e) || 0) + 1);
      const t = normalizePhone(row.phoneNumber);
      if (t) this.phones.set(t, (this.phones.get(t) || 0) + 1);
    }
    for (let i = 0; i < rows.length; i += this.concurrency) {
      const slice = rows.slice(i, i + this.concurrency);
      const results = await Promise.allSettled(slice.map(r => this.inspect(r)));
      results.forEach((res, k) => {
        this.summary.total++;
        if (res.status === 'rejected') { this.summary.errors++; return; }
        this.record(slice[k].id, res.value);
      });
    }
  }

  private record(dentalGoId: number, r: DentalGoInspection): void {
    const s = this.summary;
    s.outcomes[r.outcome]++;
    const key = r.outcome === 'NEW' ? `NEW:${r.reason}` : r.outcome;
    const sample = s.samples.get(key) ?? [];
    if (sample.length < this.sampleSize) { sample.push(dentalGoId); s.samples.set(key, sample); }

    if (r.outcome === 'NEW') s.newByReason[r.reason]++;
    if (r.outcome === 'REVIEW') s.reviewReasons.set(r.reason, (s.reviewReasons.get(r.reason) || 0) + 1);
    if ((r.outcome === 'WOULD_LINK' || r.outcome === 'LINKED_BY_ALIAS') && r.personHasOtherDentalGoId) s.linkedToPersonWithOtherDentalGoId++;
    if (r.outcome === 'WOULD_LINK') this.linkTargets.set(r.personId, (this.linkTargets.get(r.personId) || 0) + 1);
  }

  finish(): SimulationSummary {
    const s = this.summary;
    s.accountsSharingEmail = [...this.emails.values()].filter(n => n > 1).reduce((a, n) => a + n, 0);
    s.accountsSharingPhone = [...this.phones.values()].filter(n => n > 1).reduce((a, n) => a + n, 0);
    s.crmPersonsReceivingSeveralAccounts = [...this.linkTargets.values()].filter(n => n > 1).length;
    return s;
  }
}

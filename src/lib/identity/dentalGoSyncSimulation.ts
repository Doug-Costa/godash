/**
 * Simulação da sincronização da base do DentalGO (MySQL `people`) com as fichas do CRM.
 * Só conta — nunca grava.
 *
 * 1. A decisão de cada pessoa contra as fichas do CRM de HOJE vem de
 *    CanonicalIdentityService.inspectDentalGoPerson() — o mesmo caminho da gravação.
 * 2. Na gravação, as contas entram uma a uma (em ordem de ID) e cada ficha criada passa a ser
 *    candidata para as seguintes. A simulação reproduz isso em memória, com as mesmas regras
 *    (matchIdentities, canJoinProvisional, telefones genéricos, "outra conta do DentalGO").
 */
import type { DentalGoInspection } from '../services/CanonicalIdentityService';
import { isIgnoredPhone } from './genericPhones';
import { MULTI_CANDIDATE_REASON, OTHER_DENTALGO_ACCOUNT_REASON, canJoinProvisional, matchIdentities, normalizeCpf, normalizeEmail, normalizePhone, type IdentitySignals } from './matchRules';

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
  /** Revisões que só aparecem porque contas do DentalGO são comparadas entre si na gravação. */
  reviewsBetweenDentalGoAccounts: number;
  /** Já ligada (pelo registro de origem) a uma ficha que tem OUTRO ID do DentalGO. */
  linkedToPersonWithOtherDentalGoId: number;
  /** Contas do DentalGO que dividem um telefone que conta como sinal (não fictício nem genérico). */
  accountsSharingPhone: number;
  accountsSharingEmail: number;
  genericPhones: number;
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
    reviewsBetweenDentalGoAccounts: 0,
    linkedToPersonWithOtherDentalGoId: 0,
    accountsSharingPhone: 0,
    accountsSharingEmail: 0,
    genericPhones: 0,
    samples: new Map(),
    errors: 0,
  };
}

/** Ficha que a gravação criaria (ou completaria) durante a própria sincronização. */
interface VirtualPerson {
  id: string;
  signals: IdentitySignals;
  provisional: boolean;
}

/** Acumulador: alimente com lotes em ordem de ID; chame finish() no fim. */
export class DentalGoSyncSimulation {
  readonly summary = emptySummary();
  private readonly emails = new Map<string, number>();
  private readonly phones = new Map<string, number>();
  private readonly virtual = new Map<string, VirtualPerson>();
  private readonly byEmail = new Map<string, string>();
  private readonly byPhone = new Map<string, Set<string>>();
  /** Fichas do CRM que já receberam uma conta do DentalGO nesta sincronização. */
  private readonly linkedCrmPersons = new Set<string>();

  constructor(
    private readonly inspect: Inspect,
    private readonly generic: ReadonlySet<string> = new Set(),
    private readonly sampleSize = 10,
    private readonly concurrency = 8,
  ) {
    this.summary.genericPhones = generic.size;
  }

  async addBatch(rows: DentalGoPersonRow[]): Promise<void> {
    for (const row of rows) {
      const e = normalizeEmail(row.email);
      if (e) this.emails.set(e, (this.emails.get(e) || 0) + 1);
      const t = this.matchPhone(row.phoneNumber);
      if (t) this.phones.set(t, (this.phones.get(t) || 0) + 1);
    }
    for (let i = 0; i < rows.length; i += this.concurrency) {
      const slice = rows.slice(i, i + this.concurrency);
      const results = await Promise.allSettled(slice.map(r => this.inspect(r)));
      // Ajuste entre contas em ordem, como na gravação
      results.forEach((res, k) => {
        this.summary.total++;
        if (res.status === 'rejected') { this.summary.errors++; return; }
        this.record(slice[k], this.withinSync(slice[k], res.value));
      });
    }
  }

  private matchPhone(phone: string | null): string | null {
    const p = normalizePhone(phone);
    return p && !isIgnoredPhone(p, this.generic) ? p : null;
  }

  private signalsOf(row: DentalGoPersonRow): IdentitySignals {
    const email = normalizeEmail(row.email);
    const phone = this.matchPhone(row.phoneNumber);
    return {
      names: row.fullName?.trim() ? [row.fullName.trim()] : [],
      emails: email ? [email] : [],
      phones: phone ? [phone] : [],
      cpf: normalizeCpf(row.cpf),
    };
  }

  private register(row: DentalGoPersonRow, provisional: boolean): void {
    const id = `dg:${row.id}`;
    const signals = this.signalsOf(row);
    this.virtual.set(id, { id, signals, provisional });
    for (const e of signals.emails) if (!this.byEmail.has(e)) this.byEmail.set(e, id);
    for (const p of signals.phones) {
      const set = this.byPhone.get(p) ?? new Set();
      set.add(id);
      this.byPhone.set(p, set);
    }
  }

  /**
   * Resultado contra o CRM de hoje → resultado na gravação real, levando em conta as fichas
   * criadas pelas contas anteriores desta mesma sincronização.
   */
  private withinSync(row: DentalGoPersonRow, r: DentalGoInspection): DentalGoInspection & { betweenAccounts?: boolean } {
    // Segunda conta do DentalGO junta à mesma ficha do CRM → a ficha já tem outro ID → revisão
    if (r.outcome === 'WOULD_LINK') {
      if (this.linkedCrmPersons.has(r.personId)) {
        this.register(row, true);
        return { outcome: 'REVIEW', reason: OTHER_DENTALGO_ACCOUNT_REASON, candidates: 1, betweenAccounts: true };
      }
      this.linkedCrmPersons.add(r.personId);
      return r;
    }
    if (r.outcome === 'REVIEW') { this.register(row, true); return r; }
    if (r.outcome !== 'NEW') return r;

    const incoming = this.signalsOf(row);
    const ids = new Set<string>();
    for (const e of incoming.emails) { const v = this.byEmail.get(e); if (v) ids.add(v); }
    for (const p of incoming.phones) for (const v of this.byPhone.get(p) ?? []) ids.add(v);
    const candidates = [...ids].map(id => this.virtual.get(id)!);

    if (candidates.length === 0) { this.register(row, false); return r; }

    if (candidates.length === 1) {
      const c = candidates[0];
      const verdict = matchIdentities(incoming, c.signals);
      if (verdict.decision === 'DISTINCT') { this.register(row, false); return r; }
      if (verdict.decision === 'REVIEW' && c.provisional && canJoinProvisional(verdict, incoming.emails[0] ?? null, c.signals)) {
        return { outcome: 'WOULD_JOIN_PROVISIONAL', personId: c.id };
      }
      // Toda ficha criada nesta sincronização tem ID do DentalGO: junção automática vira revisão
      const reason = verdict.decision === 'AUTO_MERGE' ? OTHER_DENTALGO_ACCOUNT_REASON : verdict.reason;
      this.register(row, true);
      return { outcome: 'REVIEW', reason, candidates: 1, betweenAccounts: true };
    }

    const provisional = candidates.find(c => c.provisional);
    if (provisional && canJoinProvisional(matchIdentities(incoming, provisional.signals), incoming.emails[0] ?? null, provisional.signals)) {
      return { outcome: 'WOULD_JOIN_PROVISIONAL', personId: provisional.id };
    }
    this.register(row, true);
    return { outcome: 'REVIEW', reason: MULTI_CANDIDATE_REASON, candidates: candidates.length, betweenAccounts: true };
  }

  private record(row: DentalGoPersonRow, r: DentalGoInspection & { betweenAccounts?: boolean }): void {
    const s = this.summary;
    s.outcomes[r.outcome]++;
    const key = r.outcome === 'NEW' ? `NEW:${r.reason}` : r.betweenAccounts ? `${r.outcome}:ENTRE_CONTAS` : r.outcome;
    const sample = s.samples.get(key) ?? [];
    if (sample.length < this.sampleSize) { sample.push(row.id); s.samples.set(key, sample); }

    if (r.outcome === 'NEW') s.newByReason[r.reason]++;
    if (r.outcome === 'REVIEW') {
      s.reviewReasons.set(r.reason, (s.reviewReasons.get(r.reason) || 0) + 1);
      if (r.betweenAccounts) s.reviewsBetweenDentalGoAccounts++;
    }
    if (r.outcome === 'LINKED_BY_ALIAS' && r.personHasOtherDentalGoId) s.linkedToPersonWithOtherDentalGoId++;
  }

  finish(): SimulationSummary {
    const s = this.summary;
    s.accountsSharingEmail = [...this.emails.values()].filter(n => n > 1).reduce((a, n) => a + n, 0);
    s.accountsSharingPhone = [...this.phones.values()].filter(n => n > 1).reduce((a, n) => a + n, 0);
    return s;
  }
}

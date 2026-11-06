/**
 * Gravação da ligação da base do DentalGO (MySQL `people`) às fichas do CRM.
 *
 * Para cada conta, em ordem de ID e uma de cada vez (cada ficha criada passa a ser candidata
 * para as seguintes — a mesma ordem que a simulação reproduz):
 *   1. inspect: o que o motor vai fazer (só leitura) — usado para contar e conferir;
 *   2. resolve: grava (CanonicalIdentityService.resolveDentalGoPerson — as mesmas regras);
 *   3. confere: a ficha gravada bate com a previsão? Se não, registra a divergência.
 *
 * Idempotente: rodar de novo sobre contas já gravadas só as encontra pelo ID do DentalGO
 * (e completa campos vazios). Por isso dá para parar e retomar com --from-id.
 */
import type { DentalGoInspection } from '../services/CanonicalIdentityService';
import type { DentalGoPersonRow } from './dentalGoSyncSimulation';

export interface SyncDeps {
  /** Próxima página de contas com id > afterId, em ordem de ID. */
  fetchPage(afterId: number, take: number): Promise<DentalGoPersonRow[]>;
  inspect(row: DentalGoPersonRow): Promise<DentalGoInspection>;
  resolve(row: DentalGoPersonRow): Promise<{ id: string; externalPersonId: number | null }>;
  onProgress?(s: SyncSummary): void;
  /** Pedido de parada (Ctrl+C): termina a conta atual e para. */
  shouldStop?(): boolean;
}

export interface SyncOptions {
  fromId?: number;
  limit?: number;
  pageSize?: number;
  /** Para de vez se N contas seguidas falharem (banco fora do ar, por exemplo). */
  maxConsecutiveErrors?: number;
  sampleSize?: number;
}

export interface SyncSummary {
  processed: number;
  firstId: number | null;
  lastId: number | null;
  /** Onde retomar (--from-id): antes da primeira conta com erro, para nenhuma ficar de fora. */
  resumeFromId: number;
  outcomes: Record<DentalGoInspection['outcome'], number>;
  reviewReasons: Record<string, number>;
  /** A ficha gravada não bate com a previsão (IDs do DentalGO, até sampleSize). */
  mismatches: number[];
  mismatchCount: number;
  errors: { id: number; message: string }[];
  errorCount: number;
  aborted: string | null;
}

export function emptySyncSummary(): SyncSummary {
  return {
    processed: 0, firstId: null, lastId: null, resumeFromId: 0,
    outcomes: { LINKED_BY_ID: 0, LINKED_BY_ALIAS: 0, WOULD_LINK: 0, WOULD_JOIN_PROVISIONAL: 0, REVIEW: 0, NEW: 0 },
    reviewReasons: {}, mismatches: [], mismatchCount: 0, errors: [], errorCount: 0, aborted: null,
  };
}

/** A ficha gravada é a que a previsão dizia? */
export function matchesPrediction(row: DentalGoPersonRow, r: DentalGoInspection, person: { id: string; externalPersonId: number | null }): boolean {
  switch (r.outcome) {
    case 'LINKED_BY_ID':
    case 'LINKED_BY_ALIAS':
    case 'WOULD_LINK':
    case 'WOULD_JOIN_PROVISIONAL':
      return person.id === r.personId;
    case 'REVIEW':
    case 'NEW':
      // Ficha própria, marcada com o ID desta conta
      return person.externalPersonId === row.id;
  }
}

/** Mensagem curta de erro, sem dados da pessoa (o Prisma às vezes inclui os valores). */
function shortError(e: any): string {
  const code = e?.code ? `${e.code} ` : '';
  const msg = String(e?.message ?? e).split('\n').find(l => l.trim()) ?? '';
  return `${code}${msg.slice(0, 120)}`;
}

export async function runDentalGoSync(deps: SyncDeps, opts: SyncOptions = {}, summary = emptySyncSummary()): Promise<SyncSummary> {
  const limit = opts.limit ?? Infinity;
  const pageSize = opts.pageSize ?? 500;
  const maxErrors = opts.maxConsecutiveErrors ?? 20;
  const sampleSize = opts.sampleSize ?? 20;
  const s = summary;
  let afterId = opts.fromId ?? 0;
  let consecutive = 0;
  let hadError = false;
  s.resumeFromId = afterId;

  while (s.processed < limit && !s.aborted) {
    const rows = await deps.fetchPage(afterId, Math.min(pageSize, limit - s.processed));
    if (!rows.length) break;
    for (const row of rows) {
      if (deps.shouldStop?.()) break;
      try {
        const predicted = await deps.inspect(row);
        const person = await deps.resolve(row);
        s.outcomes[predicted.outcome]++;
        if (predicted.outcome === 'REVIEW') s.reviewReasons[predicted.reason] = (s.reviewReasons[predicted.reason] || 0) + 1;
        if (!matchesPrediction(row, predicted, person)) {
          s.mismatchCount++;
          if (s.mismatches.length < sampleSize) s.mismatches.push(row.id);
        }
        consecutive = 0;
      } catch (e) {
        hadError = true;
        s.errorCount++;
        if (s.errors.length < sampleSize) s.errors.push({ id: row.id, message: shortError(e) });
        if (++consecutive >= maxErrors) {
          s.aborted = `${maxErrors} contas seguidas com erro — interrompido (última: #${row.id})`;
        }
      }
      // Conta processada (com sucesso ou erro): avança o ponto de retomada
      s.processed++;
      s.firstId ??= row.id;
      s.lastId = row.id;
      if (!hadError) s.resumeFromId = row.id;
      afterId = row.id;
      if (s.aborted) break;
    }
    deps.onProgress?.(s);
    if (deps.shouldStop?.()) break;
  }
  return s;
}

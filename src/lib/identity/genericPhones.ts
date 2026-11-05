/**
 * Telefones genéricos: números presentes em muitas contas do DentalGO (padrão de cadastro,
 * telefone da empresa, de teste, de suporte). Não identificam ninguém — nunca juntam fichas
 * nem abrem revisão, em nenhuma origem. Decisão de 2026-11: 5 ou mais contas do DentalGO.
 *
 * Telefones fictícios por padrão (99999999, 12345678…) seguem em matchRules.isDummyPhone.
 */
import { isDummyPhone, normalizePhone, type IdentitySignals } from './matchRules';

export const GENERIC_PHONE_MIN_ACCOUNTS = 5;

/** Agrega contagens por telefone (já normalizado) e devolve os que atingem o limite. */
export function genericPhonesFromCounts(rows: { phone: string | null; n: number }[], min = GENERIC_PHONE_MIN_ACCOUNTS): Set<string> {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const p = normalizePhone(r.phone);
    if (p) counts.set(p, (counts.get(p) || 0) + Number(r.n));
  }
  return new Set([...counts].filter(([, n]) => n >= min).map(([p]) => p));
}

/** Telefone que não serve como sinal de identidade (fictício ou genérico). */
export function isIgnoredPhone(phone: string | null | undefined, generic: ReadonlySet<string>): boolean {
  const p = normalizePhone(phone);
  return !p || isDummyPhone(p) || generic.has(p);
}

/** Tira dos sinais os telefones fictícios e genéricos. */
export function withoutIgnoredPhones(s: IdentitySignals, generic: ReadonlySet<string>): IdentitySignals {
  return { ...s, phones: s.phones.filter(t => !isIgnoredPhone(t, generic)) };
}

type Query = (sql: string) => Promise<any[]>;

/** Conexão com o MySQL do DentalGO, aberta só quando a lista é calculada. */
let openedPool: { end(): Promise<void> } | null = null;
async function dentalGoQuery(sql: string): Promise<any[]> {
  const pool = (await import('../db')).default;
  openedPool = pool;
  const [rows]: any = await pool.query(sql);
  return rows as any[];
}

/** Para scripts: fecha a conexão com o DentalGO, se ela chegou a ser aberta. */
export async function closeDentalGoConnection(): Promise<void> {
  if (openedPool) await openedPool.end();
  openedPool = null;
}

/** Calcula a lista a partir da tabela `people` do DentalGO. */
export async function loadGenericPhonesFromDentalGo(query: Query, min = GENERIC_PHONE_MIN_ACCOUNTS): Promise<Set<string>> {
  const rows = await query(
    `SELECT REGEXP_REPLACE(phoneNumber, '[^0-9]', '') AS phone, COUNT(*) AS n
     FROM people WHERE phoneNumber IS NOT NULL AND phoneNumber <> ''
     GROUP BY phone HAVING COUNT(*) >= 2`,
  );
  return genericPhonesFromCounts(rows.map(r => ({ phone: r.phone, n: Number(r.n) })), min);
}

let cache: { phones: Set<string>; at: number } | null = null;
let provider: (() => Promise<Set<string>>) | null = null;
const TTL_MS = 60 * 60 * 1000;

/** Para testes: substitui a origem da lista (null volta ao DentalGO). Limpa o cache. */
export function setGenericPhonesProvider(p: (() => Promise<Set<string>>) | null): void {
  provider = p;
  cache = null;
}

const LOAD_TIMEOUT_MS = 3000;
let inFlight: Promise<Set<string>> | null = null;

/**
 * Lista atual (cache de 1h). Se o DentalGO não responder em 3s, segue sem a lista (só os
 * fictícios por padrão são ignorados), registra o erro e tenta de novo em 5 min — nunca trava
 * uma entrada.
 */
export async function getGenericPhones(): Promise<Set<string>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.phones;
  // Várias entradas ao mesmo tempo: uma única consulta
  if (!inFlight) inFlight = loadWithTimeout().finally(() => { inFlight = null; });
  return inFlight;
}

async function loadWithTimeout(): Promise<Set<string>> {
  let timer: NodeJS.Timeout | undefined;
  try {
    const load = provider
      ? provider()
      : loadGenericPhonesFromDentalGo(dentalGoQuery);
    load.catch(() => {}); // se perder para o tempo-limite, o erro tardio não vira rejeição solta
    // O DentalGO lento ou fora do ar não pode travar a entrada de clientes
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`sem resposta em ${LOAD_TIMEOUT_MS / 1000}s`)), LOAD_TIMEOUT_MS);
    });
    const phones = await Promise.race([load, timeout]);
    cache = { phones, at: Date.now() };
    return phones;
  } catch (e) {
    console.error('[genericPhones] Não foi possível calcular os telefones genéricos no DentalGO — seguindo sem a lista:', e);
    // Tenta de novo em 5 minutos, não a cada entrada
    cache = { phones: new Set(), at: Date.now() - TTL_MS + 5 * 60 * 1000 };
    return cache.phones;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Para scripts de auditoria e carga da fila: SEM a lista, um número genérico viraria milhares de
 * pares falsos — então a falha interrompe o script em vez de seguir sem ela.
 * IDENTITY_GENERIC_PHONES=none roda conscientemente sem a lista (ex.: testes sem MySQL).
 */
export async function requireGenericPhones(query?: Query): Promise<Set<string>> {
  if (process.env.IDENTITY_GENERIC_PHONES === 'none') {
    console.warn('⚠ IDENTITY_GENERIC_PHONES=none — rodando SEM a lista de telefones genéricos.');
    return new Set();
  }
  try {
    return await loadGenericPhonesFromDentalGo(query ?? dentalGoQuery);
  } catch (e: any) {
    throw new Error(`Não foi possível calcular os telefones genéricos no DentalGO (${e?.message ?? e}). `
      + 'Sem essa lista a auditoria geraria pares falsos — script interrompido.');
  }
}

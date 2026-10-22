/**
 * Regras de identidade do GODASH — decide se duas fichas são a mesma pessoa.
 *
 * Funções puras (sem banco): o motor de identidade e o script de auditoria
 * (prisma/audit-identity-duplicates.ts) usam exatamente estas regras.
 *
 * Parâmetros de negócio (definidos pelo time — não relaxar sem aprovação):
 *  1. Junta AUTOMATICAMENTE só com: e-mail igual + nome compatível.
 *  2. Mesmo e-mail/telefone com nome muito diferente (e-mail da clínica, número
 *     reciclado) → REVISÃO, nunca junta.
 *  3. Telefone igual → REVISÃO (mesmo com nome compatível).
 *  4. E-mail quase igual (erro de digitação) + nome compatível → REVISÃO.
 *  5. CPF ajuda, mas não é regra: CPF igual reforça a revisão; CPF válido nos
 *     dois lados e DIFERENTE impede a junção automática. CPF ausente não pesa.
 *  6. Erro pior = juntar pessoas diferentes. Na dúvida, não junta.
 *  7. Só o primeiro nome em comum nunca gera candidato.
 */

export interface IdentitySignals {
  names: string[];     // nome principal + nomes de aliases
  emails: string[];    // principal, secundário e de aliases
  phones: string[];    // principal, secundário e de aliases
  cpf?: string | null;
}

export type MatchDecision = 'AUTO_MERGE' | 'REVIEW' | 'DISTINCT';

export type Evidence =
  | 'EMAIL_EXACT'
  | 'EMAIL_NEAR'
  | 'PHONE_EXACT'
  | 'CPF_EXACT'
  | 'NAME_COMPATIBLE'
  | 'NAME_INCOMPATIBLE'
  | 'NAME_UNKNOWN';

export type Blocker = 'CPF_DIFFERENT';

export interface MatchResult {
  decision: MatchDecision;
  evidences: Evidence[];
  blockers: Blocker[];
  /** Motivo legível para a fila de revisão. */
  reason: string;
}

// ── Normalização ─────────────────────────────────────────────────────────────

const NAME_PARTICLES = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'del', 'la', 'di']);
const NAME_TITLES = new Set(['dr', 'dra', 'drs', 'prof', 'profa', 'sr', 'sra']);
// Nomes genéricos gravados quando a origem não trouxe nome (ex.: importador Bitrix:
// "Contato Sem Nome", "Contato Recuperado") — contam como "sem nome", nunca como nome real.
const PLACEHOLDER_RE = /^(lead|dr\.?\s*lead|sem nome|n\/a|nao informado|não informado|contato sem nome|contato recuperado)\b/i;

export function normalizeEmail(email?: string | null): string | null {
  if (!email) return null;
  const clean = email.toLowerCase().trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean) ? clean : null;
}

/** Telefone em E.164 brasileiro (+55DDXXXXXXXXX). Inválido/curto → null. */
export function normalizePhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) return `+${digits}`;
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  return null;
}

/** Telefones fictícios/de teste nunca contam como evidência. */
export function isDummyPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  const last8 = digits.slice(-8);
  return /^(\d)\1+$/.test(last8) || ['12345678', '98765432', '23456789'].includes(last8);
}

export function normalizeCpf(cpf?: string | null): string | null {
  if (!cpf) return null;
  const digits = cpf.replace(/\D/g, '');
  return isValidCpf(digits) ? digits : null;
}

export function isValidCpf(digits: string): boolean {
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false;
  for (const n of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += Number(digits[i]) * (n + 1 - i);
    if (((sum * 10) % 11) % 10 !== Number(digits[n])) return false;
  }
  return true;
}

/** Tokens do nome: minúsculo, sem acento, sem partículas e títulos. */
export function nameTokens(name?: string | null): string[] {
  if (!name || PLACEHOLDER_RE.test(name.trim()) || name.includes('@')) return [];
  return name
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s.]/g, ' ')
    .replace(/\./g, ' ')
    .split(/\s+/)
    .filter(t => t && !NAME_PARTICLES.has(t) && !NAME_TITLES.has(t));
}

// ── Comparações ──────────────────────────────────────────────────────────────

export type NameCompatibility = 'COMPATIBLE' | 'INCOMPATIBLE' | 'UNKNOWN';

/**
 * Dois nomes são compatíveis quando:
 *  - o primeiro nome é o mesmo (ou um lado tem só a inicial dele), E
 *  - um dos lados tem só o primeiro nome, OU há outro nome/sobrenome em comum,
 *    OU as iniciais de um lado ("H. C.") aparecem nos nomes do outro.
 *
 * Exigir o primeiro nome evita juntar familiares que dividem sobrenome e e-mail
 * da clínica ("Ana Costa" × "Pedro Costa"). Exigir mais um nome evita juntar
 * xarás com e-mail compartilhado ("Ana Paula Costa" × "Ana Beatriz Lima").
 *
 * "Douglas Costa", "Douglas Henrique", "Douglas Eugenio", "Douglas H.C Eugenio" e
 * "Douglas Henriquue" (erro de digitação) são compatíveis com "Douglas Henrique Costa Eugenio".
 * O primeiro nome exige igualdade exata ("Mariana" × "Mariane" não é compatível).
 */
function compareTwoNames(ta: string[], tb: string[]): NameCompatibility {
  if (ta.length === 0 || tb.length === 0) return 'UNKNOWN';

  const [fa, ...restA] = ta;
  const [fb, ...restB] = tb;
  const firstIsInitial = fa.length === 1 || fb.length === 1;
  const firstMatches = firstIsInitial ? fa[0] === fb[0] : fa === fb;
  if (!firstMatches) return 'INCOMPATIBLE';

  const fullA = restA.filter(t => t.length >= 2);
  const fullB = restB.filter(t => t.length >= 2);
  // Nomes/sobrenomes com 5+ letras toleram 1 letra de diferença ("Henriquue" × "Henrique").
  const sameToken = (x: string, y: string) =>
    x === y || (x.length >= 5 && y.length >= 5 && editDistance(x, y) <= 1);
  const sharesFullToken = fullA.some(t => fullB.some(u => sameToken(t, u)));
  if (sharesFullToken) return 'COMPATIBLE';

  // Primeiro nome sozinho só vale se ele estiver por extenso nos dois lados.
  if (firstIsInitial) return 'INCOMPATIBLE';
  if (restA.length === 0 || restB.length === 0) return 'COMPATIBLE';

  // Um lado só com iniciais ("Douglas H. C.") que batem com os nomes do outro.
  const onlyInitialsMatching = (initials: string[], names: string[]) =>
    initials.every(i => i.length === 1 && names.some(n => n[0] === i));
  if (onlyInitialsMatching(restA, restB) || onlyInitialsMatching(restB, restA)) return 'COMPATIBLE';

  return 'INCOMPATIBLE';
}

/** Compara listas de nomes (principal + aliases): basta um par compatível. */
export function compareNames(a: string[], b: string[]): NameCompatibility {
  const ta = a.map(nameTokens).filter(t => t.length > 0);
  const tb = b.map(nameTokens).filter(t => t.length > 0);
  if (ta.length === 0 || tb.length === 0) return 'UNKNOWN';
  for (const x of ta) {
    for (const y of tb) {
      if (compareTwoNames(x, y) === 'COMPATIBLE') return 'COMPATIBLE';
    }
  }
  return 'INCOMPATIBLE';
}

/** Distância de edição (Damerau–Levenshtein restrita) — captura letras trocadas. */
export function editDistance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/** E-mail quase igual: mesmo domínio, parte local com 5+ letras e até 2 diferenças. */
export function isNearEmail(a: string, b: string): boolean {
  if (a === b) return false;
  const [la, da] = a.split('@');
  const [lb, db] = b.split('@');
  if (da !== db || la.length < 5 || lb.length < 5) return false;
  return editDistance(la, lb) <= 2;
}

// ── Decisão ──────────────────────────────────────────────────────────────────

function uniq<T>(values: (T | null | undefined)[]): T[] {
  return [...new Set(values.filter((v): v is T => v !== null && v !== undefined))];
}

export function matchIdentities(incoming: IdentitySignals, candidate: IdentitySignals): MatchResult {
  const emailsA = uniq(incoming.emails.map(normalizeEmail));
  const emailsB = uniq(candidate.emails.map(normalizeEmail));
  const phonesA = uniq(incoming.phones.map(normalizePhone)).filter(p => !isDummyPhone(p));
  const phonesB = uniq(candidate.phones.map(normalizePhone)).filter(p => !isDummyPhone(p));
  const cpfA = normalizeCpf(incoming.cpf);
  const cpfB = normalizeCpf(candidate.cpf);

  const evidences: Evidence[] = [];
  const blockers: Blocker[] = [];

  const emailExact = emailsA.some(e => emailsB.includes(e));
  const emailNear = !emailExact && emailsA.some(a => emailsB.some(b => isNearEmail(a, b)));
  const phoneExact = phonesA.some(p => phonesB.includes(p));
  const cpfExact = !!cpfA && cpfA === cpfB;

  if (emailExact) evidences.push('EMAIL_EXACT');
  if (emailNear) evidences.push('EMAIL_NEAR');
  if (phoneExact) evidences.push('PHONE_EXACT');
  if (cpfExact) evidences.push('CPF_EXACT');
  if (cpfA && cpfB && cpfA !== cpfB) blockers.push('CPF_DIFFERENT');

  // Sem nenhum sinal de contato/documento em comum: pessoas diferentes (nome sozinho nunca basta).
  if (!emailExact && !emailNear && !phoneExact && !cpfExact) {
    return { decision: 'DISTINCT', evidences, blockers, reason: 'Nenhum e-mail, telefone ou CPF em comum' };
  }

  const names = compareNames(incoming.names, candidate.names);
  evidences.push(names === 'COMPATIBLE' ? 'NAME_COMPATIBLE' : names === 'INCOMPATIBLE' ? 'NAME_INCOMPATIBLE' : 'NAME_UNKNOWN');

  if (blockers.includes('CPF_DIFFERENT')) {
    return { decision: 'REVIEW', evidences, blockers, reason: 'Contato em comum, mas CPFs diferentes — provavelmente pessoas distintas (ex.: e-mail da clínica)' };
  }

  if (emailExact && names === 'COMPATIBLE') {
    return { decision: 'AUTO_MERGE', evidences, blockers, reason: 'Mesmo e-mail e nome compatível' };
  }

  if (names === 'INCOMPATIBLE') {
    const what = emailExact ? 'Mesmo e-mail' : phoneExact ? 'Mesmo telefone' : cpfExact ? 'Mesmo CPF' : 'E-mail parecido';
    return { decision: 'REVIEW', evidences, blockers, reason: `${what}, mas nomes muito diferentes (e-mail compartilhado, número reciclado ou erro de cadastro?)` };
  }

  if (emailExact) {
    return { decision: 'REVIEW', evidences, blockers, reason: 'Mesmo e-mail, mas sem nome para confirmar' };
  }
  if (cpfExact) {
    return { decision: 'REVIEW', evidences, blockers, reason: 'Mesmo CPF — forte indício de mesma pessoa' };
  }
  if (phoneExact) {
    return { decision: 'REVIEW', evidences, blockers, reason: 'Mesmo telefone — confirmar se é a mesma pessoa' };
  }
  return { decision: 'REVIEW', evidences, blockers, reason: 'E-mail quase igual (possível erro de digitação) e nome compatível' };
}

/**
 * Decide contra vários candidatos. Só junta automaticamente se exatamente UM
 * candidato qualifica para AUTO_MERGE; dois ou mais → revisão (ambíguo).
 */
export function decideAgainstCandidates<T extends { id: string; signals: IdentitySignals }>(
  incoming: IdentitySignals,
  candidates: T[],
): { decision: MatchDecision; target?: T; reviewCandidates: { candidate: T; result: MatchResult }[] } {
  const results = candidates.map(candidate => ({ candidate, result: matchIdentities(incoming, candidate.signals) }));
  const auto = results.filter(r => r.result.decision === 'AUTO_MERGE');
  const review = results.filter(r => r.result.decision === 'REVIEW');

  if (auto.length === 1 && review.length === 0) {
    return { decision: 'AUTO_MERGE', target: auto[0].candidate, reviewCandidates: [] };
  }
  if (auto.length > 0 || review.length > 0) {
    return { decision: 'REVIEW', reviewCandidates: [...auto, ...review] };
  }
  return { decision: 'DISTINCT', reviewCandidates: [] };
}

import prisma from '../prisma';
import { Person, Prisma } from '@prisma/client';
import { MULTI_CANDIDATE_REASON, OTHER_DENTALGO_ACCOUNT_REASON, canJoinProvisional, matchIdentities, normalizeCpf, type IdentitySignals, type MatchResult } from '../identity/matchRules';
import { getGenericPhones, isIgnoredPhone, withoutIgnoredPhones } from '../identity/genericPhones';

type Db = Prisma.TransactionClient | typeof prisma;

/** Marca, em IdentityReview.evidences, um caso ambíguo isolado numa Person provisória. */
export const AMBIGUOUS_PROVISIONAL = 'AMBIGUOUS_PROVISIONAL';
export const PROVISIONAL_PERSON_PREFIX = 'PROVISIONAL_PERSON:';

export interface ResolveInput {
  source: string;
  externalId: string;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  /** CPF, se a origem trouxer (ex.: Bitrix). Ajuda na regra; nunca junta sozinho. */
  cpf?: string | null;
  /** Conta do DentalGO que está entrando (só em resolveDentalGoPerson): ficha com OUTRO ID do DentalGO não recebe junção automática. */
  dentalGoId?: number | null;
  rawData?: any;
}

export { OTHER_DENTALGO_ACCOUNT_REASON, MULTI_CANDIDATE_REASON };

type Decision =
  | { kind: 'LINK'; target: string; candidates: string[]; verdict: MatchResult }
  | { kind: 'JOIN_PROVISIONAL'; target: string; candidates: string[]; verdict: MatchResult | null }
  | { kind: 'REVIEW'; candidates: string[]; verdict: MatchResult | null; reason: string }
  | { kind: 'NEW'; reason: 'NO_CANDIDATE' | 'DISTINCT'; candidates: string[] };

/** Resultado de inspectDentalGoPerson(): o que a sincronização faria com uma pessoa do DentalGO. */
export type DentalGoInspection =
  | { outcome: 'LINKED_BY_ID'; personId: string }                                         // já ligada pelo ID do DentalGO
  | { outcome: 'LINKED_BY_ALIAS'; personId: string; personHasOtherDentalGoId: boolean }    // já tem o registro de origem DENTALGO:<id>
  | { outcome: 'WOULD_LINK'; personId: string }                                           // as regras juntariam a uma ficha existente
  | { outcome: 'WOULD_JOIN_PROVISIONAL'; personId: string }                               // entraria numa ficha provisória já em revisão
  | { outcome: 'REVIEW'; reason: string; candidates: number }                             // ficha separada + revisão
  | { outcome: 'NEW'; reason: 'NO_CANDIDATE' | 'DISTINCT' };                              // ficha nova

/**
 * CDP V4 - CanonicalIdentityService
 * Serviço de Master Data Management (MDM) para resolução atômica de identidades canônicas (Person).
 */
export class CanonicalIdentityService {
  static isPlaceholderName(name?: string | null): boolean {
    if (!name) return true;
    const normalized = name.trim().toLowerCase();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return true;
    return /^(dr\.?\s*)?lead(?:\s+dentalgo)?\s*#?\s*[\w-]+$/.test(normalized)
      || ['sem nome', 'n/a', 'nao informado', 'não informado', 'contato sem nome', 'contato recuperado'].includes(normalized);
  }
  /**
   * Normaliza e-mail para minúsculas e remove espaços.
   * Dominio: Identidade Canônica
   * Input: string | null | undefined
   * Output: string | null (lowercase e sem espaços)
   */
  static normalizeEmail(email?: string | null): string | null {
    if (!email) return null;
    return email.toLowerCase().trim();
  }

  /**
   * Normaliza telefone para formato nacional E.164 (+55...).
   * Dominio: Identidade Canônica
   * Input: string | null | undefined
   * Output: string | null
   */
  static normalizePhone(phone?: string | null): string | null {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
      return `+${digits}`;
    }
    if (digits.length >= 10 && digits.length <= 11) {
      return `+55${digits}`;
    }
    return phone.trim();
  }

  /**
   * Candidatos por e-mail/telefone: campos principais, secundários e aliases.
   * Retorna IDs de Person distintos, em ordem estável.
   */
  private static async findCandidatePersonIds(db: Db, email: string | null, phone: string | null): Promise<string[]> {
    const personOr: Prisma.PersonWhereInput[] = [];
    if (email) {
      personOr.push(
        { email: { equals: email, mode: 'insensitive' } },
        { secondaryEmail: { equals: email, mode: 'insensitive' } },
      );
    }
    if (phone) personOr.push({ phoneNumber: phone }, { secondaryPhone: phone });
    if (personOr.length === 0) return [];

    const aliasOr: Prisma.IdentityAliasWhereInput[] = [];
    if (email) aliasOr.push({ email: { equals: email, mode: 'insensitive' } });
    if (phone) aliasOr.push({ phone });

    const persons = await db.person.findMany({ where: { OR: personOr }, select: { id: true } });
    const aliases = await db.identityAlias.findMany({ where: { OR: aliasOr }, select: { personId: true }, distinct: ['personId'] });
    return [...new Set([...persons.map(p => p.id), ...aliases.map(a => a.personId)])].sort();
  }

  /**
   * Locks consultivos do PostgreSQL por identificador normalizado, sempre na mesma
   * ordem (evita deadlock). Valem entre processos e containers e são liberados no
   * fim da transação.
   */
  private static async lockIdentityKeys(tx: Prisma.TransactionClient, keys: (string | null)[]): Promise<void> {
    const ordered = [...new Set(keys.filter((k): k is string => !!k))].sort();
    for (const key of ordered) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
    }
  }

  /**
   * Entre os candidatos, a Person provisória de um caso ambíguo ainda pendente de
   * revisão. Entradas novas com os mesmos contatos se juntam a ela em vez de criar
   * outra ficha (interrompe a cascata).
   */
  private static async findPendingProvisional(db: Db, candidateIds: string[]): Promise<string | null> {
    if (candidateIds.length === 0) return null;
    const reviews = await db.identityReview.findMany({
      where: { status: 'PENDING', evidences: { array_contains: [AMBIGUOUS_PROVISIONAL] } },
      select: { evidences: true },
    });
    const provisionalIds = new Set(
      reviews
        .flatMap(r => (Array.isArray(r.evidences) ? r.evidences : []))
        .filter((e): e is string => typeof e === 'string' && e.startsWith(PROVISIONAL_PERSON_PREFIX))
        .map(e => e.slice(PROVISIONAL_PERSON_PREFIX.length)),
    );
    return candidateIds.find(id => provisionalIds.has(id)) ?? null;
  }

  /** Sinais de identidade de uma Person (principais, secundários e aliases), para as regras. */
  private static async signalsOfPerson(db: Db, personId: string): Promise<IdentitySignals | null> {
    const p = await db.person.findUnique({
      where: { id: personId },
      select: {
        fullName: true, email: true, secondaryEmail: true, phoneNumber: true, secondaryPhone: true, cpf: true,
        identityAliases: { select: { name: true, email: true, phone: true } },
      },
    });
    if (!p) return null;
    return {
      names: [p.fullName, ...p.identityAliases.map(a => a.name)].filter((n): n is string => !!n),
      emails: [p.email, p.secondaryEmail, ...p.identityAliases.map(a => a.email)].filter((e): e is string => !!e),
      phones: [p.phoneNumber, p.secondaryPhone, ...p.identityAliases.map(a => a.phone)].filter((t): t is string => !!t),
      cpf: p.cpf,
    };
  }

  /**
   * Com um único candidato, aplica as regras de identidade (src/lib/identity/matchRules.ts):
   * só junta com e-mail igual + nome compatível; telefone sozinho, e-mail compartilhado com
   * nome diferente, CPF divergente etc. vão para revisão.
   */
  private static async judgeSingleCandidate(
    db: Db,
    candidateId: string,
    incoming: { name: string | null; email: string | null; phone: string | null; cpf?: string | null },
    generic: ReadonlySet<string>,
  ): Promise<MatchResult> {
    const candidate = await this.signalsOfPerson(db, candidateId);
    const signals: IdentitySignals = {
      names: incoming.name ? [incoming.name] : [],
      emails: incoming.email ? [incoming.email] : [],
      phones: incoming.phone ? [incoming.phone] : [],
      cpf: incoming.cpf ?? null,
    };
    return matchIdentities(signals, withoutIgnoredPhones(candidate ?? { names: [], emails: [], phones: [] }, generic));
  }

  /** Telefone usado para BUSCAR e COMPARAR: fictícios e genéricos não contam (continuam gravados na ficha). */
  private static matchPhone(phone: string | null, generic: ReadonlySet<string>): string | null {
    return phone && !isIgnoredPhone(phone, generic) ? phone : null;
  }

  /**
   * A decisão do motor, igual para gravação (resolve), pré-checagem (inspect) e simulação
   * (inspectDentalGoPerson): candidatos por e-mail/telefone → regras com um candidato →
   * provisória pendente do mesmo caso → revisão ou ficha nova.
   * `dentalGoId`: conta do DentalGO que está entrando; uma ficha que já tem OUTRO ID do
   * DentalGO não recebe a junção automática (vai para revisão).
   */
  private static async decide(
    db: Db,
    incoming: { name: string | null; email: string | null; phone: string | null; cpf: string | null },
    generic: ReadonlySet<string>,
    dentalGoId?: number | null,
  ): Promise<Decision> {
    const candidates = await this.findCandidatePersonIds(db, incoming.email, incoming.phone);
    if (candidates.length === 0) return { kind: 'NEW', reason: 'NO_CANDIDATE', candidates };

    if (candidates.length === 1) {
      let verdict = await this.judgeSingleCandidate(db, candidates[0], incoming, generic);
      if (verdict.decision === 'AUTO_MERGE' && dentalGoId != null) {
        const c = await db.person.findUnique({ where: { id: candidates[0] }, select: { externalPersonId: true } });
        if (c?.externalPersonId != null && c.externalPersonId !== dentalGoId) {
          verdict = { ...verdict, decision: 'REVIEW', reason: OTHER_DENTALGO_ACCOUNT_REASON };
        }
      }
      if (verdict.decision === 'AUTO_MERGE') return { kind: 'LINK', target: candidates[0], candidates, verdict };
      if (verdict.decision === 'DISTINCT') return { kind: 'NEW', reason: 'DISTINCT', candidates };
      const provisional = await this.findPendingProvisional(db, candidates);
      if (provisional && canJoinProvisional(verdict, incoming.email, await this.signalsOfPerson(db, provisional))) {
        return { kind: 'JOIN_PROVISIONAL', target: provisional, candidates, verdict };
      }
      return { kind: 'REVIEW', candidates, verdict, reason: verdict.reason };
    }

    const provisional = await this.findPendingProvisional(db, candidates);
    if (provisional) {
      const signals = await this.signalsOfPerson(db, provisional);
      const vsProvisional = await this.judgeSingleCandidate(db, provisional, incoming, generic);
      if (canJoinProvisional(vsProvisional, incoming.email, signals)) {
        return { kind: 'JOIN_PROVISIONAL', target: provisional, candidates, verdict: null };
      }
    }
    return { kind: 'REVIEW', candidates, verdict: null, reason: MULTI_CANDIDATE_REASON };
  }

  /**
   * Inspeção read-only da identidade para o Pre-flight (CDP V4).
   * Diferente de `resolve()`, este método NUNCA executa mutações no banco.
   * Ele retorna o status e a possível Person encontrada.
   */
  static async inspect(input: Omit<ResolveInput, 'rawData'>): Promise<{ status: 'FOUND' | 'NOT_FOUND' | 'AMBIGUOUS'; personId?: string }> {
    const { source, externalId } = input;

    // 1. Tentar encontrar o Alias existente
    const existingAlias = await prisma.identityAlias.findUnique({
      where: { source_externalId: { source, externalId } },
      select: { personId: true },
    });
    if (existingAlias) return { status: 'FOUND', personId: existingAlias.personId };

    // 2. Mesma decisão da gravação
    const generic = await getGenericPhones();
    const d = await this.decide(prisma, {
      name: input.name?.trim() || null,
      email: this.normalizeEmail(input.email),
      phone: this.matchPhone(this.normalizePhone(input.phone), generic),
      cpf: normalizeCpf(input.cpf),
    }, generic, input.dentalGoId);
    if (d.kind === 'LINK' || d.kind === 'JOIN_PROVISIONAL') return { status: 'FOUND', personId: d.target };
    return d.kind === 'REVIEW' ? { status: 'AMBIGUOUS' } : { status: 'NOT_FOUND' };
  }

  /**
   * Resolve uma única identidade de forma atômica e segura entre processos.
   * Dominio: Resolução de Identidade Canônica
   * Input: ResolveInput { source, externalId, email, phone, name, rawData }
   * Output: Promise<Person>
   *
   * - Locks consultivos por alias/e-mail/telefone + releitura dentro da transação:
   *   chamadas simultâneas para a mesma pessoa não criam duas Persons.
   * - Um único candidato: vincula o alias a ele (comportamento anterior).
   * - Vários candidatos (ex.: e-mail aponta para A e telefone para B): NÃO funde e
   *   NÃO liga a nenhum deles. Cria uma Person provisória isolada + IdentityReview
   *   pendente; entradas seguintes com os mesmos contatos reutilizam essa provisória.
   */
  static async resolve(input: ResolveInput): Promise<Person> {
    const { source, externalId, rawData } = input;
    const email = this.normalizeEmail(input.email);
    const phone = this.normalizePhone(input.phone);
    const name = input.name?.trim() || null;
    const cpf = normalizeCpf(input.cpf);
    const parsedRawData = rawData ? (typeof rawData === 'string' ? JSON.parse(rawData) : rawData) : null;
    // Telefone fictício ou genérico: continua gravado na ficha, mas não busca nem compara
    const generic = await getGenericPhones();
    const matchPhone = this.matchPhone(phone, generic);

    return prisma.$transaction(async (tx) => {
      await this.lockIdentityKeys(tx, [
        `alias:${source}:${externalId}`,
        email && `email:${email}`,
        matchPhone && `phone:${matchPhone}`,
      ]);

      // 1. Alias desta origem já existe (releitura após os locks)
      const existingAlias = await tx.identityAlias.findUnique({
        where: { source_externalId: { source, externalId } },
        include: { person: true },
      });

      if (existingAlias) {
        const person = existingAlias.person;

        // Enriquecimento Oportunístico: complementa dados vazios se o payload contiver novos valores confiáveis
        const updates: Prisma.PersonUpdateInput = {};
        if (!person.email && email) updates.email = email;
        if (!person.phoneNumber && phone) updates.phoneNumber = phone;
        if (!person.cpf && cpf) updates.cpf = cpf;
        if (this.isPlaceholderName(person.fullName) && name && !this.isPlaceholderName(name)) updates.fullName = name;

        const aliasUpdates: Prisma.IdentityAliasUpdateInput = {};
        if (!existingAlias.email && email) aliasUpdates.email = email;
        if (!existingAlias.phone && phone) aliasUpdates.phone = phone;
        if (this.isPlaceholderName(existingAlias.name) && name && !this.isPlaceholderName(name)) aliasUpdates.name = name;
        if (!existingAlias.rawData && parsedRawData) aliasUpdates.rawData = parsedRawData;

        if (Object.keys(aliasUpdates).length > 0) {
          await tx.identityAlias.update({ where: { id: existingAlias.id }, data: aliasUpdates });
        }
        if (Object.keys(updates).length > 0) {
          console.log(`[CanonicalIdentityService] Enriquecendo dados vazios da Person ${person.id}`);
          return tx.person.update({ where: { id: person.id }, data: updates });
        }
        return person;
      }

      // 2. A decisão do motor (mesma da pré-checagem e da simulação)
      const d = await this.decide(tx, { name, email, phone: matchPhone, cpf }, generic, input.dentalGoId);
      const candidates = d.candidates;
      const verdict = d.kind === 'NEW' ? null : d.verdict;
      const target = d.kind === 'LINK' || d.kind === 'JOIN_PROVISIONAL' ? d.target : null;
      const needsReview = d.kind === 'REVIEW';

      // 2a. Junção permitida pelas regras (ou a provisória pendente do mesmo caso): vincula o alias
      if (target) {
        const linkedAlias = await tx.identityAlias.create({
          data: { source, externalId, email, phone, name, rawData: parsedRawData, personId: target },
          include: { person: true },
        });

        const updates: Prisma.PersonUpdateInput = {};
        if (!linkedAlias.person.email && email) updates.email = email;
        if (!linkedAlias.person.phoneNumber && phone) updates.phoneNumber = phone;
        if (!linkedAlias.person.cpf && cpf) updates.cpf = cpf;
        if (this.isPlaceholderName(linkedAlias.person.fullName) && name && !this.isPlaceholderName(name)) updates.fullName = name;

        if (Object.keys(updates).length > 0) {
          return tx.person.update({ where: { id: linkedAlias.personId }, data: updates });
        }
        return linkedAlias.person;
      }

      // 2b. Nenhum candidato → Person nova; caso que precisa de revisão → Person provisória isolada + revisão
      const newAlias = await tx.identityAlias.create({
        data: {
          source, externalId, email, phone, name, rawData: parsedRawData,
          person: { create: { fullName: name, email, phoneNumber: phone, cpf, source } },
        },
        include: { person: true },
      });

      if (needsReview) {
        await tx.identityReview.create({
          data: {
            incomingSource: source,
            incomingExternalId: externalId,
            candidatePersonId: candidates[0],
            confidenceScore: 0,
            evidences: [
              AMBIGUOUS_PROVISIONAL,
              `${PROVISIONAL_PERSON_PREFIX}${newAlias.person.id}`,
              ...(verdict ? [`REASON:${d.kind === 'REVIEW' ? d.reason : verdict.reason}`, ...verdict.evidences, ...verdict.blockers] : [
                `REASON:${MULTI_CANDIDATE_REASON}`,
                ...(email ? ['EMAIL_MATCH'] : []),
                ...(matchPhone ? ['PHONE_MATCH'] : []),
              ]),
              ...candidates.map(id => `CANDIDATE:${id}`),
            ],
            status: 'PENDING',
          },
        });
        console.log(`[CanonicalIdentityService] Revisão ${source}:${externalId} → Person provisória ${newAlias.person.id} (candidatos: ${candidates.join(', ')}; ${d.kind === 'REVIEW' ? d.reason : ''}), aguardando revisão`);
      } else {
        console.log(`[CanonicalIdentityService] Nova Person criada (${newAlias.person.id}) vinculada ao alias ${source}:${externalId}`);
      }
      return newAlias.person;
    }, { maxWait: 15000, timeout: 30000 });
  }

  /**
   * Ficha de uma pessoa do DentalGO (MySQL `people.id`).
   *
   * 1. FATO: se já existe Person com esse externalPersonId, é ela (completa só campos vazios).
   * 2. Senão, passa por resolve() — trava, busca por e-mail/telefone em campos principais,
   *    secundários e aliases, e isola casos ambíguos — com o alias DENTALGO:<id>, que
   *    garante uma única ficha mesmo com chamadas simultâneas para o mesmo id.
   * 3. Marca o externalPersonId na ficha encontrada, se ela ainda não tiver um.
   *
   * Substitui a criação direta de Person que existia na entrada em campanha, que não
   * conferia e-mail/telefone (duplicava quem já tinha vindo por CSV, Bitrix ou formulário).
   */
  static async resolveDentalGoPerson(
    externalPersonId: number,
    info?: { fullName?: string | null; email?: string | null; phoneNumber?: string | null; cpf?: string | null } | null,
  ): Promise<Person> {
    const email = this.normalizeEmail(info?.email);
    const phone = this.normalizePhone(info?.phoneNumber);
    const name = info?.fullName?.trim() || null;
    const cpf = normalizeCpf(info?.cpf);

    const byId = await prisma.person.findFirst({ where: { externalPersonId }, orderBy: { createdAt: 'asc' } });
    if (byId) {
      const updates: Prisma.PersonUpdateInput = {};
      if (!byId.email && email) updates.email = email;
      if (!byId.phoneNumber && phone) updates.phoneNumber = phone;
      if (!byId.cpf && cpf) updates.cpf = cpf;
      if (this.isPlaceholderName(byId.fullName) && name && !this.isPlaceholderName(name)) updates.fullName = name;
      return Object.keys(updates).length > 0
        ? prisma.person.update({ where: { id: byId.id }, data: updates })
        : byId;
    }

    const person = await this.resolve({ source: 'DENTALGO', externalId: String(externalPersonId), email, phone, name, cpf, dentalGoId: externalPersonId });
    if (person.externalPersonId === null) {
      return prisma.person.update({ where: { id: person.id }, data: { externalPersonId } });
    }
    if (person.externalPersonId !== externalPersonId) {
      console.warn(`[CanonicalIdentityService] DentalGO #${externalPersonId} ligado à Person ${person.id}, que já tem o DentalGO #${person.externalPersonId} (mesmo contato em duas contas)`);
    }
    return person;
  }

  /**
   * Versão SÓ DE LEITURA de resolveDentalGoPerson(): diz o que aconteceria, sem gravar nada.
   * Segue os mesmos passos e as mesmas regras (ID do DentalGO → alias DENTALGO:<id> →
   * candidatos por e-mail/telefone julgados por matchIdentities → provisória pendente).
   * Usada na simulação da sincronização da base do DentalGO.
   */
  static async inspectDentalGoPerson(
    externalPersonId: number,
    info?: { fullName?: string | null; email?: string | null; phoneNumber?: string | null; cpf?: string | null } | null,
  ): Promise<DentalGoInspection> {
    const email = this.normalizeEmail(info?.email);
    const phone = this.normalizePhone(info?.phoneNumber);
    const name = info?.fullName?.trim() || null;
    const cpf = normalizeCpf(info?.cpf);

    const byId = await prisma.person.findFirst({ where: { externalPersonId }, orderBy: { createdAt: 'asc' }, select: { id: true } });
    if (byId) return { outcome: 'LINKED_BY_ID', personId: byId.id };

    const otherDentalGoId = async (personId: string) => {
      const p = await prisma.person.findUnique({ where: { id: personId }, select: { externalPersonId: true } });
      return p?.externalPersonId != null && p.externalPersonId !== externalPersonId;
    };

    const alias = await prisma.identityAlias.findUnique({
      where: { source_externalId: { source: 'DENTALGO', externalId: String(externalPersonId) } },
      select: { personId: true },
    });
    if (alias) return { outcome: 'LINKED_BY_ALIAS', personId: alias.personId, personHasOtherDentalGoId: await otherDentalGoId(alias.personId) };

    const generic = await getGenericPhones();
    const d = await this.decide(prisma, { name, email, phone: this.matchPhone(phone, generic), cpf }, generic, externalPersonId);
    switch (d.kind) {
      case 'LINK': return { outcome: 'WOULD_LINK', personId: d.target };
      case 'JOIN_PROVISIONAL': return { outcome: 'WOULD_JOIN_PROVISIONAL', personId: d.target };
      case 'REVIEW': return { outcome: 'REVIEW', reason: d.reason, candidates: d.candidates.length };
      case 'NEW': return { outcome: 'NEW', reason: d.reason };
    }
  }

  /**
   * Resolve um lote de identidades de forma idempotente e de alta performance.
   * Dominio: Resolução de Lotes de Identidade (idempotente)
   * Input: ResolveInput[]
   * Output: Map<"source:externalId", personId>
   */
  static async resolveMany(inputs: ResolveInput[]): Promise<Map<string, string>> {
    if (!inputs || inputs.length === 0) {
      return new Map();
    }

    // 1. Normalizar e deduplicar em memória
    const uniqueInputsMap = new Map<string, ResolveInput>();
    for (const input of inputs) {
      const key = `${input.source}:${input.externalId}`;
      uniqueInputsMap.set(key, input);
    }

    const uniqueInputs = Array.from(uniqueInputsMap.values());

    // 2. Buscar todos os aliases existentes na base via consulta unificada
    const whereConditions = uniqueInputs.map(input => ({
      source: input.source,
      externalId: input.externalId
    }));

    const existingAliases = await prisma.identityAlias.findMany({
      where: {
        OR: whereConditions
      }
    });

    const existingAliasMap = new Map<string, string>();
    for (const alias of existingAliases) {
      const key = `${alias.source}:${alias.externalId}`;
      existingAliasMap.set(key, alias.personId);
    }

    // 3. Calcular a diferença (não resolvidos)
    const missingInputs = uniqueInputs.filter(input => {
      const key = `${input.source}:${input.externalId}`;
      return !existingAliasMap.has(key);
    });

    // 4. Resolver concorrentemente-seguro os faltantes
    for (const input of missingInputs) {
      const person = await this.resolve(input);
      const key = `${input.source}:${input.externalId}`;
      existingAliasMap.set(key, person.id);
    }

    // 5. Retornar mapa mapeado
    return existingAliasMap;
  }
}

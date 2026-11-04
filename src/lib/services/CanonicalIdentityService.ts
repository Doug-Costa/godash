import prisma from '../prisma';
import { Person, Prisma } from '@prisma/client';
import { matchIdentities, normalizeCpf, type IdentitySignals, type MatchResult } from '../identity/matchRules';

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
  rawData?: any;
}

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
  ): Promise<MatchResult> {
    const candidate = await this.signalsOfPerson(db, candidateId);
    const signals: IdentitySignals = {
      names: incoming.name ? [incoming.name] : [],
      emails: incoming.email ? [incoming.email] : [],
      phones: incoming.phone ? [incoming.phone] : [],
      cpf: incoming.cpf ?? null,
    };
    return matchIdentities(signals, candidate ?? { names: [], emails: [], phones: [] });
  }

  /**
   * Inspeção read-only da identidade para o Pre-flight (CDP V4).
   * Diferente de `resolve()`, este método NUNCA executa mutações no banco.
   * Ele retorna o status e a possível Person encontrada.
   */
  static async inspect(input: Omit<ResolveInput, 'rawData'>): Promise<{ status: 'FOUND' | 'NOT_FOUND' | 'AMBIGUOUS'; personId?: string }> {
    const { source, externalId } = input;
    const email = this.normalizeEmail(input.email);
    const phone = this.normalizePhone(input.phone);

    // 1. Tentar encontrar o Alias existente
    const existingAlias = await prisma.identityAlias.findUnique({
      where: {
        source_externalId: { source, externalId }
      },
      select: { personId: true }
    });

    if (existingAlias) {
      return { status: 'FOUND', personId: existingAlias.personId };
    }

    // 2. E-mail/telefone em campos principais, secundários e aliases
    const candidates = await this.findCandidatePersonIds(prisma, email, phone);
    if (candidates.length === 1) {
      const verdict = await this.judgeSingleCandidate(prisma, candidates[0], {
        name: input.name?.trim() || null, email, phone, cpf: input.cpf,
      });
      if (verdict.decision === 'AUTO_MERGE') return { status: 'FOUND', personId: candidates[0] };
      if (verdict.decision === 'DISTINCT') return { status: 'NOT_FOUND' };
      const provisional = await this.findPendingProvisional(prisma, candidates);
      return provisional ? { status: 'FOUND', personId: provisional } : { status: 'AMBIGUOUS' };
    }
    if (candidates.length > 1) {
      const provisional = await this.findPendingProvisional(prisma, candidates);
      return provisional ? { status: 'FOUND', personId: provisional } : { status: 'AMBIGUOUS' };
    }
    return { status: 'NOT_FOUND' };
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

    return prisma.$transaction(async (tx) => {
      await this.lockIdentityKeys(tx, [
        `alias:${source}:${externalId}`,
        email && `email:${email}`,
        phone && `phone:${phone}`,
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

      // 2. Candidatos por e-mail/telefone (principais, secundários e aliases)
      const candidates = await this.findCandidatePersonIds(tx, email, phone);

      // Um candidato: as regras decidem. Vários: só a provisória pendente do mesmo caso.
      let target: string | null = null;
      let verdict: MatchResult | null = null;
      if (candidates.length === 1) {
        verdict = await this.judgeSingleCandidate(tx, candidates[0], { name, email, phone, cpf });
        if (verdict.decision === 'AUTO_MERGE') target = candidates[0];
        // REVIEW: se o próprio candidato é a provisória pendente deste caso, a entrada se junta a ela
        else if (verdict.decision === 'REVIEW') target = await this.findPendingProvisional(tx, candidates);
        // DISTINCT (ex.: só um telefone fictício em comum): ficha nova, sem revisão
      } else if (candidates.length > 1) {
        target = await this.findPendingProvisional(tx, candidates);
      }
      const needsReview = !target && (candidates.length > 1 || verdict?.decision === 'REVIEW');

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
              ...(verdict ? [`REASON:${verdict.reason}`, ...verdict.evidences, ...verdict.blockers] : [
                ...(email ? ['EMAIL_MATCH'] : []),
                ...(phone ? ['PHONE_MATCH'] : []),
              ]),
              ...candidates.map(id => `CANDIDATE:${id}`),
            ],
            status: 'PENDING',
          },
        });
        console.log(`[CanonicalIdentityService] Revisão ${source}:${externalId} → Person provisória ${newAlias.person.id} (candidatos: ${candidates.join(', ')}${verdict ? `; ${verdict.reason}` : ''}), aguardando revisão`);
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

    const person = await this.resolve({ source: 'DENTALGO', externalId: String(externalPersonId), email, phone, name, cpf });
    if (person.externalPersonId === null) {
      return prisma.person.update({ where: { id: person.id }, data: { externalPersonId } });
    }
    if (person.externalPersonId !== externalPersonId) {
      console.warn(`[CanonicalIdentityService] DentalGO #${externalPersonId} ligado à Person ${person.id}, que já tem o DentalGO #${person.externalPersonId} (mesmo contato em duas contas)`);
    }
    return person;
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

import prisma from '../prisma';
import { Person } from '@prisma/client';

export interface ResolveInput {
  source: string;
  externalId: string;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
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
      || ['sem nome', 'n/a', 'nao informado', 'não informado'].includes(normalized);
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

    // 2. Busca canônica flexível (E-mail OU Telefone)
    const OR_conditions: any[] = [];
    if (email) OR_conditions.push({ email });
    if (phone) OR_conditions.push({ phoneNumber: phone });

    if (OR_conditions.length > 0) {
      const candidates = await prisma.person.findMany({
        where: { OR: OR_conditions },
        select: { id: true },
        take: 2
      });

      if (candidates.length === 1) {
        return { status: 'FOUND', personId: candidates[0].id };
      }
      if (candidates.length > 1) {
        return { status: 'AMBIGUOUS' };
      }
    }

    // 3. Busca por Aliases paralelos (se não achou pela Person base)
    if (OR_conditions.length > 0) {
      const aliasCandidates = await prisma.identityAlias.findMany({
        where: {
          OR: [
            ...(email ? [{ email }] : []),
            ...(phone ? [{ phone }] : [])
          ]
        },
        select: { personId: true },
        distinct: ['personId']
      });

      if (aliasCandidates.length === 1) {
        return { status: 'FOUND', personId: aliasCandidates[0].personId };
      }
      if (aliasCandidates.length > 1) {
        return { status: 'AMBIGUOUS' };
      }
    }

    return { status: 'NOT_FOUND' };
  }

  /**
   * Resolve uma única identidade de forma atômica e concorrida-segura.
   * Dominio: Resolução de Identidade Canônica
   * Input: ResolveInput { source, externalId, email, phone, name, rawData }
   * Output: Promise<Person>
   */
  static async resolve(input: ResolveInput): Promise<Person> {
    const { source, externalId, rawData } = input;
    const email = this.normalizeEmail(input.email);
    const phone = this.normalizePhone(input.phone);
    const name = input.name?.trim() || null;

    // 1. Tentar encontrar o Alias existente
    const existingAlias = await prisma.identityAlias.findUnique({
      where: {
        source_externalId: { source, externalId }
      },
      include: { person: true }
    });

    if (existingAlias) {
      const person = existingAlias.person;
      
      // Enriquecimento Oportunístico: complementa dados vazios se o payload contiver novos valores confiáveis
      let needsEnrichment = false;
      const updates: any = {};

      if (!person.email && email) {
        updates.email = email;
        needsEnrichment = true;
      }
      if (!person.phoneNumber && phone) {
        updates.phoneNumber = phone;
        needsEnrichment = true;
      }
      if (this.isPlaceholderName(person.fullName) && name && !this.isPlaceholderName(name)) {
        updates.fullName = name;
        needsEnrichment = true;
      }

      const aliasUpdates: any = {};
      if (!existingAlias.email && email) aliasUpdates.email = email;
      if (!existingAlias.phone && phone) aliasUpdates.phone = phone;
      if (this.isPlaceholderName(existingAlias.name) && name && !this.isPlaceholderName(name)) aliasUpdates.name = name;
      if (!existingAlias.rawData && rawData) {
        aliasUpdates.rawData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      }

      if (Object.keys(aliasUpdates).length > 0) {
        await prisma.identityAlias.update({ where: { id: existingAlias.id }, data: aliasUpdates });
      }

      if (needsEnrichment) {
        console.log(`[CanonicalIdentityService] Enriquecendo dados vazios da Person ${person.id}`);
        return prisma.person.update({
          where: { id: person.id },
          data: updates
        });
      }

      return person;
    }

    // O preflight pode ter encontrado uma Person existente por e-mail/telefone mesmo
    // quando o alias desta fonte ainda não existe. Vincule a nova origem à identidade
    // canônica em vez de criar uma Person duplicada no commit.
    const identityMatch = await this.inspect({ source, externalId, email, phone, name });
    if (identityMatch.status === 'FOUND' && identityMatch.personId) {
      try {
        const linkedAlias = await prisma.identityAlias.create({
          data: {
            source,
            externalId,
            email,
            phone,
            name,
            rawData: rawData ? (typeof rawData === 'string' ? JSON.parse(rawData) : rawData) : null,
            personId: identityMatch.personId
          },
          include: { person: true }
        });

        const updates: { email?: string; phoneNumber?: string; fullName?: string } = {};
        if (!linkedAlias.person.email && email) updates.email = email;
        if (!linkedAlias.person.phoneNumber && phone) updates.phoneNumber = phone;
        if (this.isPlaceholderName(linkedAlias.person.fullName) && name && !this.isPlaceholderName(name)) updates.fullName = name;

        if (Object.keys(updates).length > 0) {
          return prisma.person.update({ where: { id: linkedAlias.personId }, data: updates });
        }
        return linkedAlias.person;
      } catch (error: any) {
        if (error.code === 'P2002') {
          const winner = await prisma.identityAlias.findUnique({
            where: { source_externalId: { source, externalId } },
            include: { person: true }
          });
          if (winner) return winner.person;
        }
        throw error;
      }
    }

    // 2. Criação Atômica com tratamento de concorrência extrema
    try {
      // O Prisma executa isso como um nested write atômico dentro de uma transação implícita
      const newAlias = await prisma.identityAlias.create({
        data: {
          source,
          externalId,
          email,
          phone,
          name,
          rawData: rawData ? (typeof rawData === 'string' ? JSON.parse(rawData) : rawData) : null,
          person: {
            create: {
              fullName: name,
              email,
              phoneNumber: phone,
              source
            }
          }
        },
        include: { person: true }
      });

      console.log(`[CanonicalIdentityService] Nova Person criada (${newAlias.person.id}) vinculada ao alias ${source}:${externalId}`);
      return newAlias.person;
    } catch (error: any) {
      // P2002 indica que outra requisição concorrente inseriu o mesmo alias de origem primeiro
      if (error.code === 'P2002') {
        console.log(`[CanonicalIdentityService] Colisão de concorrência para ${source}:${externalId}. Buscando registro vencedor...`);
        const winningAlias = await prisma.identityAlias.findUnique({
          where: {
            source_externalId: { source, externalId }
          },
          include: { person: true }
        });

        if (winningAlias) {
          return winningAlias.person;
        }
      }
      throw error;
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

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
      if (!person.fullName && name) {
        updates.fullName = name;
        needsEnrichment = true;
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

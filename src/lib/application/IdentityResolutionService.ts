import prisma from '@/lib/prisma';
import { Customer, Person } from '@prisma/client';

export type ResolutionAction = 'FOUND' | 'SUGGEST_MERGE' | 'CREATE_NEW';

export interface ResolutionResult {
  action: ResolutionAction;
  person?: Person;
  candidates?: Person[]; // candidatos quando SUGGEST_MERGE
  confidence?: number;   // score 0-100
}

/**
 * IdentityResolutionService — Fase 1 (2026-08)
 *
 * Resolve a identidade de uma entrada de dados em 3 níveis:
 *
 * NÍVEL 1 — AUTO-MERGE (confiança >= 90)
 *   Match exato por: externalPersonId OU email (normalizado) OU phoneNumber (normalizado)
 *   → Retorna a Person existente imediatamente
 *
 * NÍVEL 2 — SUGGEST_MERGE (confiança 60-89)
 *   Name similarity > 80% + pelo menos 1 sinal parcial
 *   → Retorna candidatos para revisão humana (não faz merge automático)
 *
 * NÍVEL 3 — CREATE_NEW (confiança < 60)
 *   → Nenhum match, deve criar nova Person
 */
export class IdentityResolutionService {

  // ─── Normalização ─────────────────────────────────────────────────────────

  static normalizePhone(raw: string | null | undefined): string | null {
    if (!raw) return null;
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 10) return null;
    if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
      return `+${digits}`;
    }
    if (digits.length >= 10 && digits.length <= 11) {
      return `+55${digits}`;
    }
    return `+${digits}`;
  }

  static normalizeEmail(raw: string | null | undefined): string | null {
    if (!raw) return null;
    const clean = raw.toLowerCase().trim();
    if (clean.length < 5 || !clean.includes('@')) return null;
    return clean;
  }

  // ─── Resolução Principal ───────────────────────────────────────────────────

  static async resolve(params: {
    externalPersonId?: number | null;
    phoneNumber?: string | null;
    email?: string | null;
    fullName?: string | null;
  }): Promise<ResolutionResult> {
    const { externalPersonId, fullName } = params;
    const email = this.normalizeEmail(params.email);
    const phoneNumber = this.normalizePhone(params.phoneNumber);

    // ── NÍVEL 1: Match determinístico (confiança alta) ─────────────────────

    // 1a. externalPersonId (peso 100 — ID único no sistema legado)
    if (externalPersonId && !isNaN(externalPersonId)) {
      const match = await prisma.person.findFirst({
        where: { externalPersonId: Number(externalPersonId) }
      });
      if (match) return { action: 'FOUND', person: match, confidence: 100 };
    }

    // 1b. Email principal (peso 95)
    if (email) {
      const match = await prisma.person.findFirst({
        where: { email }
      });
      if (match) return { action: 'FOUND', person: match, confidence: 95 };

      // 1b2. Email secundário (peso 90)
      const matchSecondary = await prisma.person.findFirst({
        where: { secondaryEmail: email }
      });
      if (matchSecondary) return { action: 'FOUND', person: matchSecondary, confidence: 90 };

      // 1b3. Email em IdentityAlias (peso 88 — email antigo conhecido)
      const aliasMatch = await prisma.identityAlias.findFirst({
        where: { email },
        include: { person: true }
      });
      if (aliasMatch) return { action: 'FOUND', person: aliasMatch.person, confidence: 88 };
    }

    // 1c. Telefone principal normalizado (peso 90)
    if (phoneNumber) {
      const match = await prisma.person.findFirst({
        where: { phoneNumber }
      });
      if (match) return { action: 'FOUND', person: match, confidence: 90 };

      // 1c2. Telefone secundário (fixo/clínica, peso 50)
      const matchSecondary = await prisma.person.findFirst({
        where: { secondaryPhone: phoneNumber }
      });
      if (matchSecondary) return { action: 'FOUND', person: matchSecondary, confidence: 50 };

      // 1c3. Telefone em IdentityAlias (peso 85)
      const aliasMatch = await prisma.identityAlias.findFirst({
        where: { phone: phoneNumber },
        include: { person: true }
      });
      if (aliasMatch) return { action: 'FOUND', person: aliasMatch.person, confidence: 85 };
    }

    // ── NÍVEL 2: Candidatos para revisão humana ────────────────────────────
    // Busca por nome similar (só se tiver nome com >= 4 palavras para evitar falsos positivos)
    if (fullName && fullName.trim().split(' ').length >= 2) {
      const nameParts = fullName.trim().split(' ').filter(p => p.length > 2);
      const candidates = await prisma.person.findMany({
        where: {
          fullName: {
            // Busca por correspondência parcial do nome (primeiro + último nome)
            contains: nameParts[0],
            mode: 'insensitive'
          }
        },
        take: 5
      });

      const scored = candidates
        .map(c => ({ person: c, score: this.nameSimilarity(fullName, c.fullName || '') }))
        .filter(c => c.score >= 70)
        .sort((a, b) => b.score - a.score);

      if (scored.length > 0) {
        return {
          action: 'SUGGEST_MERGE',
          candidates: scored.map(s => s.person),
          confidence: scored[0].score
        };
      }
    }

    // ── NÍVEL 3: Nenhum match ──────────────────────────────────────────────
    return { action: 'CREATE_NEW', confidence: 0 };
  }

  // ─── Compatibilidade retroativa ───────────────────────────────────────────
  /**
   * @deprecated Use resolve() para o novo fluxo tipado.
   * Mantido para compatibilidade com código existente que usa resolveIdentity().
   */
  static async resolveIdentity(params: {
    externalPersonId?: number | null;
    phoneNumber?: string | null;
    email?: string | null;
  }): Promise<Customer | null> {
    const result = await this.resolve(params);
    if (result.action === 'FOUND' && result.person) {
      // Retorna o Customer mais recente vinculado a essa Person
      return prisma.customer.findFirst({
        where: { personId: result.person.id },
        orderBy: { createdAt: 'desc' }
      });
    }
    return null;
  }

  // ─── Utilitários ──────────────────────────────────────────────────────────

  /**
   * Calcula similaridade entre dois nomes (0-100).
   * Usa comparação de tokens (palavras do nome).
   */
  private static nameSimilarity(a: string, b: string): number {
    if (!a || !b) return 0;
    const tokensA = a.toLowerCase().split(/\s+/).filter(t => t.length > 1);
    const tokensB = b.toLowerCase().split(/\s+/).filter(t => t.length > 1);
    if (tokensA.length === 0 || tokensB.length === 0) return 0;

    let matches = 0;
    for (const token of tokensA) {
      if (tokensB.some(t => t === token || t.startsWith(token) || token.startsWith(t))) {
        matches++;
      }
    }

    return Math.round((matches / Math.max(tokensA.length, tokensB.length)) * 100);
  }

  /**
   * Registra um novo sinal de identidade para uma Person existente.
   * Deve ser chamado quando uma Person já existente recebe uma nova entrada.
   */
  static async registerAlias(personId: string, params: {
    source: string;
    externalId?: string;
    email?: string | null;
    phone?: string | null;
    name?: string | null;
    rawData?: Record<string, any>;
  }): Promise<void> {
    const email = this.normalizeEmail(params.email);
    const phone = this.normalizePhone(params.phone);
    const externalId = params.externalId || `gen_${Math.random().toString(36).substring(2, 11)}`;

    // Evitar alias duplicado
    const exists = await prisma.identityAlias.findFirst({
      where: {
        personId,
        email: email || undefined,
        phone: phone || undefined,
        source: params.source
      }
    });

    if (!exists) {
      await prisma.identityAlias.create({
        data: {
          personId,
          source: params.source,
          externalId,
          email,
          phone,
          name: params.name,
          rawData: params.rawData as any
        }
      });
    }

    // Enriquecer Person com dados faltantes
    const person = await prisma.person.findUnique({ where: { id: personId } });
    if (person) {
      const updates: any = {};
      if (!person.email && email) updates.email = email;
      if (!person.secondaryEmail && email && person.email && person.email !== email) {
        updates.secondaryEmail = email;
      }
      if (!person.phoneNumber && phone) updates.phoneNumber = phone;
      if (!person.secondaryPhone && phone && person.phoneNumber && person.phoneNumber !== phone) {
        updates.secondaryPhone = phone;
      }
      if (!person.fullName && params.name) updates.fullName = params.name;

      if (Object.keys(updates).length > 0) {
        await prisma.person.update({ where: { id: personId }, data: updates });
      }
    }
  }
}

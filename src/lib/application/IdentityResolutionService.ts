import prisma from '@/lib/prisma';
import { Customer, Person } from '@prisma/client';

export type ResolutionAction = 
  | 'AUTO_MATCH' 
  | 'FOUND'             // alias para AUTO_MATCH (compatibilidade)
  | 'REVIEW_REQUIRED' 
  | 'SUGGEST_MERGE'     // alias para REVIEW_REQUIRED (compatibilidade)
  | 'CONFLICT' 
  | 'CREATE_NEW';

export interface CandidateEvaluation {
  person: Person;
  score: number;
  evidences: string[];
  conflicts: string[];
  isDummyPhoneMatch?: boolean;
}

export interface ResolutionResult {
  action: ResolutionAction;
  person?: Person;
  candidates?: Person[];
  evaluations?: CandidateEvaluation[];
  confidence?: number; // 0-100
  evidences?: string[];
  conflictReason?: string;
}

/**
 * IdentityResolutionService — CDP V4
 *
 * Resolução de Identidade Canônica Assistida por Ranking de Candidatos:
 *
 * 1. AUTO_MATCH / FOUND (confiança >= 85 e sem conflito grave)
 *    Candidato claramente dominante com dados consistentes.
 *
 * 2. REVIEW_REQUIRED / SUGGEST_MERGE (confiança 55-84 ou margem estreita)
 *    Dois candidatos próximos ou divergência que demanda olhar humano.
 *
 * 3. CONFLICT
 *    Conflito estrutural grave (ex: E-mail pertence à Person A e Telefone pertence à Person B).
 *    Jamais faz auto-merge silencioso.
 *
 * 4. CREATE_NEW (confiança < 50)
 *    Nenhum candidato relevante, cria nova Person canônica.
 */
export class IdentityResolutionService {

  // ─── Normalização & Validação ──────────────────────────────────────────────

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

  /**
   * Identifica se um telefone é fictício / genérico de teste (ex: 99999-9999, 00000-0000, 12345678)
   * Telefones de teste NÃO devem acionar auto-merge sozinhos para evitar colisões silenciosas.
   */
  static isDummyTestPhone(raw: string | null | undefined): boolean {
    if (!raw) return false;
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 8) return true;
    const last8 = digits.slice(-8);
    const last9 = digits.slice(-9);

    // Repetições completas (ex: 99999999, 00000000, 11111111)
    if (/^(\d)\1+$/.test(last8) || /^(\d)\1+$/.test(last9)) return true;
    if (last8 === '12345678' || last9 === '123456789' || last8 === '98765432') return true;
    if (/^9{7,}$/.test(last8) || /^0{7,}$/.test(last8)) return true;

    return false;
  }

  // ─── Resolução Principal com Ranking Comparativo ───────────────────────────

  static async resolve(params: {
    externalPersonId?: number | null;
    phoneNumber?: string | null;
    email?: string | null;
    fullName?: string | null;
  }): Promise<ResolutionResult> {
    const { externalPersonId, fullName } = params;
    const email = this.normalizeEmail(params.email);
    const phoneNumber = this.normalizePhone(params.phoneNumber);
    const isDummyPhone = this.isDummyTestPhone(phoneNumber);

    // ── 0. Match prioritário por externalPersonId (ID do MySQL legado) ─────────
    if (externalPersonId && !isNaN(externalPersonId)) {
      const match = await prisma.person.findFirst({
        where: { externalPersonId: Number(externalPersonId) }
      });
      if (match) {
        return {
          action: 'AUTO_MATCH',
          person: match,
          confidence: 100,
          evidences: ['EXTERNAL_ID_EXACT']
        };
      }
    }

    // ── 1. Mapear todos os candidatos por Email, Telefone e Aliases ───────────
    const candidateMap = new Map<string, Person>();

    // 1a. Busca por e-mail
    if (email) {
      const byEmail = await prisma.person.findMany({
        where: {
          OR: [
            { email },
            { secondaryEmail: email }
          ]
        }
      });
      byEmail.forEach(p => candidateMap.set(p.id, p));

      const byAliasEmail = await prisma.identityAlias.findMany({
        where: { email },
        include: { person: true }
      });
      byAliasEmail.forEach(a => {
        if (a.person) candidateMap.set(a.person.id, a.person);
      });
    }

    // 1b. Busca por telefone
    if (phoneNumber) {
      const byPhone = await prisma.person.findMany({
        where: {
          OR: [
            { phoneNumber },
            { secondaryPhone: phoneNumber }
          ]
        }
      });
      byPhone.forEach(p => candidateMap.set(p.id, p));

      const byAliasPhone = await prisma.identityAlias.findMany({
        where: { phone: phoneNumber },
        include: { person: true }
      });
      byAliasPhone.forEach(a => {
        if (a.person) candidateMap.set(a.person.id, a.person);
      });
    }

    // 1c. Busca por nome se houver nome estruturado
    if (fullName && fullName.trim().split(/\s+/).length >= 2) {
      const firstName = fullName.trim().split(/\s+/)[0];
      if (firstName.length >= 3) {
        const byName = await prisma.person.findMany({
          where: {
            fullName: {
              startsWith: firstName,
              mode: 'insensitive'
            }
          },
          take: 6
        });
        byName.forEach(p => candidateMap.set(p.id, p));
      }
    }

    const candidateList = Array.from(candidateMap.values());

    if (candidateList.length === 0) {
      return { action: 'CREATE_NEW', confidence: 0, evidences: [] };
    }

    // ── 2. Avaliar e pontuar cada candidato ──────────────────────────────────
    const evaluations: CandidateEvaluation[] = [];

    for (const cand of candidateList) {
      let score = 0;
      const evidences: string[] = [];
      const conflicts: string[] = [];

      // Avaliação de E-mail
      if (email) {
        if (cand.email === email) {
          score += 95;
          evidences.push('EMAIL_EXACT');
        } else if (cand.secondaryEmail === email) {
          score += 90;
          evidences.push('SECONDARY_EMAIL_EXACT');
        } else {
          // Checar se está nos aliases do candidato
          const hasAliasEmail = await prisma.identityAlias.findFirst({
            where: { personId: cand.id, email }
          });
          if (hasAliasEmail) {
            score += 85;
            evidences.push('ALIAS_EMAIL_EXACT');
          } else if (cand.email && cand.email !== email) {
            // Candidato já possui um e-mail primário diferente
            score -= 60;
            conflicts.push(`EMAIL_DIVERGENT (${cand.email})`);
          }
        }
      }

      // Avaliação de Telefone
      if (phoneNumber) {
        if (isDummyPhone) {
          // Telefone de teste / fictício: não pode dar pontuação determinante
          score += 10;
          evidences.push('DUMMY_PHONE_WEAK_SIGNAL');
        } else if (cand.phoneNumber === phoneNumber) {
          score += 90;
          evidences.push('PHONE_EXACT');
        } else if (cand.secondaryPhone === phoneNumber) {
          score += 50;
          evidences.push('SECONDARY_PHONE_EXACT');
        } else {
          const hasAliasPhone = await prisma.identityAlias.findFirst({
            where: { personId: cand.id, phone: phoneNumber }
          });
          if (hasAliasPhone) {
            score += 80;
            evidences.push('ALIAS_PHONE_EXACT');
          } else if (cand.phoneNumber && cand.phoneNumber !== phoneNumber) {
            score -= 40;
            conflicts.push(`PHONE_DIVERGENT (${cand.phoneNumber})`);
          }
        }
      }

      // Avaliação de Nome
      if (fullName && cand.fullName) {
        const similarity = this.nameSimilarity(fullName, cand.fullName);
        if (similarity >= 85) {
          score += 30;
          evidences.push(`NAME_HIGH_SIMILARITY (${similarity}%)`);
        } else if (similarity >= 65) {
          score += 20;
          evidences.push(`NAME_PARTIAL_SIMILARITY (${similarity}%)`);
        } else if (similarity >= 40) {
          score += 10;
          evidences.push(`NAME_WEAK_SIMILARITY (${similarity}%)`);
        } else if (similarity < 25 && cand.fullName.trim().split(/\s+/).length >= 2) {
          score -= 30;
          conflicts.push(`NAME_DISSIMILAR (${cand.fullName})`);
        }
      }

      const finalScore = Math.max(0, Math.min(score, 100));
      evaluations.push({
        person: cand,
        score: finalScore,
        evidences,
        conflicts,
        isDummyPhoneMatch: isDummyPhone
      });
    }

    // Ordenar avaliações por pontuação decrescente
    evaluations.sort((a, b) => b.score - a.score);

    // ── 3. Detecção de Conflito Estrutural (Cross-Identity Collision) ────────
    // Exemplo: O e-mail bate com Person A, mas o telefone (real, não-dummy) bate com Person B
    if (email && phoneNumber && !isDummyPhone && candidateList.length >= 2) {
      const emailWinner = evaluations.find(e => e.evidences.some(ev => ev.includes('EMAIL')));
      const phoneWinner = evaluations.find(e => e.evidences.some(ev => ev.includes('PHONE_EXACT')));

      if (emailWinner && phoneWinner && emailWinner.person.id !== phoneWinner.person.id) {
        return {
          action: 'CONFLICT',
          candidates: [emailWinner.person, phoneWinner.person],
          evaluations,
          confidence: Math.max(emailWinner.score, phoneWinner.score),
          evidences: [...emailWinner.evidences, ...phoneWinner.evidences],
          conflictReason: `E-mail pertence a "${emailWinner.person.fullName || emailWinner.person.id}" e Telefone pertence a "${phoneWinner.person.fullName || phoneWinner.person.id}"`
        };
      }
    }

    const best = evaluations[0];
    const second = evaluations[1];

    // ── 4. Decisão por Faixas de Confiança ───────────────────────────────────

    // Sem pontuação suficiente -> Novo cadastro
    if (!best || best.score < 50) {
      return {
        action: 'CREATE_NEW',
        confidence: best ? best.score : 0,
        evaluations,
        evidences: best ? best.evidences : []
      };
    }

    // Alta confiança e dominante (score >= 85 com margem de pelo menos 20 pts ou sem segundo concorrente)
    const margin = second ? (best.score - second.score) : 100;
    if (best.score >= 85 && margin >= 20) {
      return {
        action: 'AUTO_MATCH',
        person: best.person,
        candidates: evaluations.map(e => e.person),
        evaluations,
        confidence: best.score,
        evidences: best.evidences
      };
    }

    // Caso ambíguo ou pontuação intermediária (50-84) ou margem estreita -> Fila de Revisão
    return {
      action: 'REVIEW_REQUIRED',
      person: best.person, // candidato mais provável sugerido
      candidates: evaluations.map(e => e.person),
      evaluations,
      confidence: best.score,
      evidences: best.evidences,
      conflictReason: best.conflicts.length > 0 
        ? `Inconsistências encontradas: ${best.conflicts.join(', ')}`
        : (second ? `Empate técnico entre "${best.person.fullName}" (${best.score} pts) e "${second.person.fullName}" (${second.score} pts)` : 'Confiança moderada')
    };
  }

  // ─── Compatibilidade retroativa ───────────────────────────────────────────
  /**
   * @deprecated Use resolve() para o fluxo tipado do CDP V4.
   */
  static async resolveIdentity(params: {
    externalPersonId?: number | null;
    phoneNumber?: string | null;
    email?: string | null;
  }): Promise<Customer | null> {
    const result = await this.resolve(params);
    if ((result.action === 'AUTO_MATCH' || result.action === 'FOUND') && result.person) {
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
   * Compara tokens e lida com abreviações/sobrenomes compostos.
   */
  static nameSimilarity(a: string, b: string): number {
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
   * Registra um novo sinal de identidade para uma Person existente (Auditoria/Alias).
   * PRESERVA a identidade canônica e nunca sobrescreve dados primários automaticamente.
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

    // Evitar alias duplicado idêntico
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

    // Enriquecer Person SOMENTE com dados faltantes (nunca sobrescrever campos preenchidos)
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


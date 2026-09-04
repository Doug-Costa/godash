import prisma from '../prisma';
import { Person } from '@prisma/client';
import { CanonicalIdentityService } from './CanonicalIdentityService';

export interface MatchingInput {
  source: string;
  externalId: string;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  rawData?: any;
}

/**
 * CDP V4 - IdentityMatchingService
 * Gerenciamento probabilístico de colisões e fluxo Human-in-the-Loop (HITL) para qualidade de dados.
 */
export class IdentityMatchingService {
  /**
   * Executa a análise probabilística e gera sugestões ou cria revisões pendentes.
   * Dominio: Matching de Identidade
   */
  static async analyzeAndMatch(input: MatchingInput): Promise<{
    action: 'AUTO_RESOLVED' | 'REVIEW_REQUIRED';
    personId?: string;
    reviewId?: string;
  }> {
    const { source, externalId, rawData } = input;
    const email = CanonicalIdentityService.normalizeEmail(input.email);
    const phone = CanonicalIdentityService.normalizePhone(input.phone);
    const name = input.name?.trim() || null;

    // 1. Se já existe alias mapeado determinístico, resolve direto
    const existingAlias = await prisma.identityAlias.findUnique({
      where: {
        source_externalId: { source, externalId }
      }
    });
    if (existingAlias) {
      return { action: 'AUTO_RESOLVED', personId: existingAlias.personId };
    }

    // 2. Procurar candidatos por e-mail ou telefone para detectar possíveis colisões ambíguas
    const candidates: Person[] = [];
    const evidences: string[] = [];
    let score = 0;

    if (email) {
      const emailMatches = await prisma.person.findMany({
        where: {
          OR: [
            { email },
            { secondaryEmail: email }
          ]
        }
      });
      if (emailMatches.length > 0) {
        candidates.push(...emailMatches);
        evidences.push('EMAIL_EXACT');
        score += 80;
      }
    }

    if (phone) {
      const phoneMatches = await prisma.person.findMany({
        where: {
          OR: [
            { phoneNumber: phone },
            { secondaryPhone: phone }
          ]
        }
      });
      for (const pm of phoneMatches) {
        if (!candidates.some(c => c.id === pm.id)) {
          candidates.push(pm);
        }
      }
      evidences.push('PHONE_EXACT');
      score += 80;
    }

    if (name) {
      const nameMatches = await prisma.person.findMany({
        where: {
          fullName: {
            startsWith: name.split(' ')[0],
            mode: 'insensitive'
          }
        }
      });
      for (const nm of nameMatches) {
        if (!candidates.some(c => c.id === nm.id)) {
          candidates.push(nm);
          evidences.push('NAME_SIMILARITY');
          score += 20;
        }
      }
    }

    // Se houver conflitos probabilísticos, joga para a fila de revisão HITL
    if (candidates.length > 0) {
      const confidenceScore = Math.min(score, 100);

      // Cria a tarefa de revisão pendente
      const review = await prisma.identityReview.create({
        data: {
          incomingSource: source,
          incomingExternalId: externalId,
          candidatePersonId: candidates[0].id,
          confidenceScore,
          evidences: evidences,
          status: 'PENDING',
          decision: null
        }
      });

      console.log(`[IdentityMatchingService] Ambiguidade detectada para ${source}:${externalId}. Criando IdentityReview id: ${review.id}`);
      return {
        action: 'REVIEW_REQUIRED',
        reviewId: review.id
      };
    }

    // 3. Sem colisão: resolve de forma determinizada
    const person = await CanonicalIdentityService.resolve(input);
    return { action: 'AUTO_RESOLVED', personId: person.id };
  }

  /**
   * HITL Action: LINK
   * Aponta o alias entrante para uma identidade (Person) existente reconhecida.
   */
  static async link(reviewId: string, personId: string, reviewedById: string): Promise<void> {
    const review = await prisma.identityReview.findUnique({
      where: { id: reviewId }
    });

    if (!review || review.status !== 'PENDING') {
      throw new Error('Revisão não encontrada ou já processada.');
    }

    // Vincula o Alias à Person
    await prisma.identityAlias.create({
      data: {
        source: review.incomingSource,
        externalId: review.incomingExternalId,
        personId
      }
    });

    // Atualiza status do review
    await prisma.identityReview.update({
      where: { id: reviewId },
      data: {
        status: 'PROCESSED',
        decision: 'LINK',
        reviewedById,
        reviewedAt: new Date()
      }
    });

    console.log(`[IdentityMatchingService] HITL LINK: Alias (${review.incomingSource}:${review.incomingExternalId}) vinculado à Person ${personId}`);
  }

  /**
   * HITL Action: REJECT
   * Rejeita o link sugerido e cria uma Person exclusiva para o alias órfão.
   */
  static async reject(reviewId: string, reviewedById: string): Promise<Person> {
    const review = await prisma.identityReview.findUnique({
      where: { id: reviewId }
    });

    if (!review || review.status !== 'PENDING') {
      throw new Error('Revisão não encontrada ou já processada.');
    }

    // Cria nova Person autônoma
    const person = await prisma.person.create({
      data: {
        source: review.incomingSource,
        externalPersonId: /^\d+$/.test(review.incomingExternalId) ? Number(review.incomingExternalId) : null,
        identityAliases: {
          create: {
            source: review.incomingSource,
            externalId: review.incomingExternalId
          }
        }
      }
    });

    // Atualiza status do review
    await prisma.identityReview.update({
      where: { id: reviewId },
      data: {
        status: 'PROCESSED',
        decision: 'REJECT',
        reviewedById,
        reviewedAt: new Date()
      }
    });

    console.log(`[IdentityMatchingService] HITL REJECT: Person independente ${person.id} criada para alias ${review.incomingSource}:${review.incomingExternalId}`);
    return person;
  }

  /**
   * HITL Action: DEFER
   * Adia o julgamento (ex: mantendo em observação / standby).
   */
  static async defer(reviewId: string, reviewedById: string): Promise<void> {
    const review = await prisma.identityReview.findUnique({
      where: { id: reviewId }
    });

    if (!review || review.status !== 'PENDING') {
      throw new Error('Revisão não encontrada ou já processada.');
    }

    await prisma.identityReview.update({
      where: { id: reviewId },
      data: {
        status: 'DEFERRED',
        decision: 'DEFER',
        reviewedById,
        reviewedAt: new Date()
      }
    });

    console.log(`[IdentityMatchingService] HITL DEFER: Decisão postergada para a revisão ${reviewId}`);
  }

  /**
   * Atualiza os campos canônicos oficiais de uma Person (Decisão Administrativa).
   */
  static async updateCanonicalPerson(
    personId: string,
    data: {
      fullName?: string | null;
      email?: string | null;
      phoneNumber?: string | null;
    },
    updatedById?: string
  ): Promise<Person> {
    const updates: any = {};
    if (data.fullName !== undefined) updates.fullName = data.fullName;
    if (data.email !== undefined) updates.email = data.email ? CanonicalIdentityService.normalizeEmail(data.email) : null;
    if (data.phoneNumber !== undefined) updates.phoneNumber = data.phoneNumber ? CanonicalIdentityService.normalizePhone(data.phoneNumber) : null;

    return prisma.person.update({
      where: { id: personId },
      data: updates
    });
  }

  /**
   * Unifica duas Persons (sourcePersonId e targetPersonId).
   * Move todos os Aliases, Customers, tarefas e históricos de forma segura e auditada.
   * Suporta sobreposição opcional de campos canônicos oficiais (canonicalOverrides).
   * Dominio: Fusão de Pessoas (Merge)
   */
  static async mergePersons(
    sourcePersonId: string,
    targetPersonId: string,
    decidedById: string,
    reason: string,
    canonicalOverrides?: {
      fullName?: string | null;
      email?: string | null;
      phoneNumber?: string | null;
    }
  ): Promise<void> {
    if (sourcePersonId === targetPersonId) {
      throw new Error('Não é possível mesclar uma identidade consigo mesma.');
    }

    const sourcePerson = await prisma.person.findUnique({
      where: { id: sourcePersonId },
      include: { identityAliases: true, customers: true }
    });

    const targetPerson = await prisma.person.findUnique({
      where: { id: targetPersonId },
      include: { identityAliases: true, customers: true }
    });

    if (!sourcePerson || !targetPerson) {
      throw new Error('Uma ou ambas as identidades para fusão não foram encontradas.');
    }

    // Executar todo o merge em uma única transação atômica
    await prisma.$transaction(async (tx) => {
      // 1. Gravar o MergeEvent com metadados para trilha de auditoria e reversibilidade
      await tx.mergeEvent.create({
        data: {
          sourcePersonId,
          targetPersonId,
          decidedById,
          reason,
          metadata: {
            sourcePerson: {
              fullName: sourcePerson.fullName,
              email: sourcePerson.email,
              phoneNumber: sourcePerson.phoneNumber,
              aliasesCount: sourcePerson.identityAliases.length,
              customersCount: sourcePerson.customers.length
            },
            targetPerson: {
              fullName: targetPerson.fullName,
              email: targetPerson.email,
              phoneNumber: targetPerson.phoneNumber
            }
          }
        }
      });

      // 2. Mover IdentityAliases da source para o target
      await tx.identityAlias.updateMany({
        where: { personId: sourcePersonId },
        data: { personId: targetPersonId }
      });

      // 3. Mover ou mesclar Customers para evitar conflitos de restrição única
      for (const sourceCust of sourcePerson.customers) {
        // Verificar se a Person sobrevivente já possui um Customer na mesma jornada
        const conflictingCust = targetPerson.customers.find(
          c => c.journeyId === sourceCust.journeyId
        );

        if (conflictingCust) {
          // Conflito de jornada: Mapear e migrar históricos (interações, tarefas, oportunidades)
          console.log(`[IdentityMatchingService] Fusão de Customer: Mapeando histórico de ${sourceCust.id} para ${conflictingCust.id}`);
          
          await tx.interaction.updateMany({
            where: { customerId: sourceCust.id },
            data: { customerId: conflictingCust.id }
          });

          await tx.task.updateMany({
            where: { customerId: sourceCust.id },
            data: { customerId: conflictingCust.id }
          });

          await tx.opportunity.updateMany({
            where: { customerId: sourceCust.id },
            data: { customerId: conflictingCust.id }
          });

          await tx.customerProduct.updateMany({
            where: { customerId: sourceCust.id },
            data: { customerId: conflictingCust.id }
          });

          // Deletar o Customer redundante da source
          await tx.customer.delete({
            where: { id: sourceCust.id }
          });
        } else {
          // Sem conflito: Reaponta a Person do Customer
          await tx.customer.update({
            where: { id: sourceCust.id },
            data: { personId: targetPersonId }
          });
        }
      }

      // 4. Se houver sobreposição de dados canônicos escolhidos pelo Admin, aplica na Person sobrevivente
      if (canonicalOverrides) {
        const updates: any = {};
        if (canonicalOverrides.fullName !== undefined && canonicalOverrides.fullName !== null) {
          updates.fullName = canonicalOverrides.fullName;
        }
        if (canonicalOverrides.email !== undefined && canonicalOverrides.email !== null) {
          updates.email = CanonicalIdentityService.normalizeEmail(canonicalOverrides.email);
        }
        if (canonicalOverrides.phoneNumber !== undefined && canonicalOverrides.phoneNumber !== null) {
          updates.phoneNumber = CanonicalIdentityService.normalizePhone(canonicalOverrides.phoneNumber);
        }
        if (Object.keys(updates).length > 0) {
          await tx.person.update({
            where: { id: targetPersonId },
            data: updates
          });
        }
      }

      // 5. Deletar a Person original mesclada (aliases e customers já foram re-apontados)
      await tx.person.delete({
        where: { id: sourcePersonId }
      });
    });

    console.log(`[IdentityMatchingService] Fusão concluída com sucesso: Person ${sourcePersonId} mesclada em ${targetPersonId}`);
  }
}

import prisma from '../prisma';
import { Person, Prisma } from '@prisma/client';
import { AMBIGUOUS_PROVISIONAL, CanonicalIdentityService, PROVISIONAL_PERSON_PREFIX } from './CanonicalIdentityService';
import { absorbPersonIdOf, auditKindOf, isBatchable, keepPersonIdOf } from '../identity/reviewQueue';

/** Person provisória de um caso ambíguo (criada pelo CanonicalIdentityService), se a revisão for desse tipo. */
export function provisionalPersonIdOf(evidences: unknown): string | null {
  if (!Array.isArray(evidences) || !evidences.includes(AMBIGUOUS_PROVISIONAL)) return null;
  const tag = evidences.find((e): e is string => typeof e === 'string' && e.startsWith(PROVISIONAL_PERSON_PREFIX));
  return tag ? tag.slice(PROVISIONAL_PERSON_PREFIX.length) : null;
}

/** IDs das Persons candidatas listadas nas evidências de um caso ambíguo. */
export function candidatePersonIdsOf(evidences: unknown): string[] {
  if (!Array.isArray(evidences)) return [];
  return evidences
    .filter((e): e is string => typeof e === 'string' && e.startsWith('CANDIDATE:'))
    .map(e => e.slice('CANDIDATE:'.length));
}

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
    if (auditKindOf(review.evidences)) {
      throw new Error('Revisão da auditoria de identidade: use as ações da fila de auditoria.');
    }

    // Caso ambíguo isolado numa Person provisória: unir a provisória à Person escolhida
    const provisionalId = provisionalPersonIdOf(review.evidences);
    if (provisionalId) {
      if (provisionalId === personId) {
        throw new Error('Escolha uma das pessoas candidatas — a ficha provisória não pode ser vinculada a ela mesma.');
      }
      await this.mergePersons(
        provisionalId,
        personId,
        reviewedById,
        `Revisão ${reviewId}: caso ambíguo resolvido — ficha provisória unida à pessoa escolhida`,
        undefined,
        async (tx) => {
          await tx.identityReview.update({
            where: { id: reviewId },
            data: { status: 'PROCESSED', decision: 'LINK', reviewedById, reviewedAt: new Date() }
          });
        },
        { reviewId }
      );
      console.log(`[IdentityMatchingService] HITL LINK (provisória): Person ${provisionalId} unida a ${personId}`);
      return;
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
    if (auditKindOf(review.evidences)) {
      throw new Error('Revisão da auditoria de identidade: use as ações da fila de auditoria.');
    }

    // Caso ambíguo: a ficha provisória já é a Person separada — só confirma
    const provisionalId = provisionalPersonIdOf(review.evidences);
    if (provisionalId) {
      const provisional = await prisma.person.findUnique({ where: { id: provisionalId } });
      if (!provisional) throw new Error('Ficha provisória não encontrada.');
      await prisma.identityReview.update({
        where: { id: reviewId },
        data: { status: 'PROCESSED', decision: 'REJECT', reviewedById, reviewedAt: new Date() }
      });
      console.log(`[IdentityMatchingService] HITL REJECT (provisória): Person ${provisionalId} confirmada como pessoa distinta`);
      return provisional;
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
   * Decide uma revisão criada pela carga das auditorias (prisma/load-identity-review-queue.ts).
   *
   *  - MERGE_SUGGESTED / PAIR_REVIEW:
   *      MERGE         → junta as duas fichas (keepPersonId escolhe qual fica; padrão = a sugerida)
   *      KEEP_SEPARATE → confirma que são pessoas diferentes
   *  - MIXED_SUSPECT (só inspeção, nunca separa automaticamente):
   *      CONFIRM_SAME  → a ficha está correta
   *      NEEDS_SPLIT   → marca a ficha para separação manual (continua visível como adiada)
   *
   * Se alguma das fichas já não existir (ex.: foi unida por outra revisão), fecha como OBSOLETE.
   */
  static async resolveAuditReview(
    reviewId: string,
    decision: 'MERGE' | 'KEEP_SEPARATE' | 'CONFIRM_SAME' | 'NEEDS_SPLIT',
    reviewedById: string,
    keepPersonId?: string,
  ): Promise<{ outcome: 'MERGED' | 'CLOSED' | 'OBSOLETE'; mergeEventId?: string }> {
    const review = await prisma.identityReview.findUnique({ where: { id: reviewId } });
    if (!review || !['PENDING', 'DEFERRED'].includes(review.status)) {
      throw new Error('Revisão não encontrada ou já processada.');
    }
    const kind = auditKindOf(review.evidences);
    if (!kind) throw new Error('Esta revisão não veio da auditoria de identidade.');

    const close = (db: Prisma.TransactionClient | typeof prisma, status: string, finalDecision: string) =>
      db.identityReview.update({
        where: { id: reviewId },
        data: { status, decision: finalDecision, reviewedById, reviewedAt: new Date() },
      });

    if (kind === 'MIXED_SUSPECT') {
      if (decision === 'CONFIRM_SAME') {
        await close(prisma, 'PROCESSED', 'CONFIRMED_SAME');
        return { outcome: 'CLOSED' };
      }
      if (decision === 'NEEDS_SPLIT') {
        await close(prisma, 'DEFERRED', 'SPLIT_NEEDED');
        return { outcome: 'CLOSED' };
      }
      throw new Error('Para suspeitas de ficha misturada use CONFIRM_SAME ou NEEDS_SPLIT.');
    }

    const suggestedKeep = keepPersonIdOf(review.evidences);
    const suggestedAbsorb = absorbPersonIdOf(review.evidences);
    if (!suggestedKeep || !suggestedAbsorb) throw new Error('Revisão sem as duas fichas do par.');

    if (decision === 'KEEP_SEPARATE') {
      await close(prisma, 'PROCESSED', 'REJECT');
      return { outcome: 'CLOSED' };
    }
    if (decision !== 'MERGE') throw new Error('Para pares use MERGE ou KEEP_SEPARATE.');

    const keep = keepPersonId ?? suggestedKeep;
    if (keep !== suggestedKeep && keep !== suggestedAbsorb) {
      throw new Error('A ficha que fica precisa ser uma das duas do par.');
    }
    const absorb = keep === suggestedKeep ? suggestedAbsorb : suggestedKeep;

    const found = await prisma.person.count({ where: { id: { in: [keep, absorb] } } });
    if (found < 2) {
      await close(prisma, 'PROCESSED', 'OBSOLETE');
      return { outcome: 'OBSOLETE' };
    }

    const mergeEventId = await this.mergePersons(
      absorb,
      keep,
      reviewedById,
      `Revisão ${reviewId} (auditoria: ${kind === 'MERGE_SUGGESTED' ? 'junção sugerida' : 'par de dúvida'})`,
      undefined,
      async (tx) => { await close(tx, 'PROCESSED', 'LINK'); },
      { reviewId },
    );
    return { outcome: 'MERGED', mergeEventId };
  }

  /**
   * Aprovação em lote, só para revisões marcadas como aprováveis em lote (junções
   * sugeridas e telefone + nome compatível) e só com os IDs escolhidos na tela.
   * Cada item é decidido separadamente; falha em um não desfaz os outros.
   */
  static async resolveAuditReviewsBatch(reviewIds: string[], reviewedById: string) {
    const results: { reviewId: string; outcome: string; error?: string }[] = [];
    for (const reviewId of reviewIds) {
      try {
        const review = await prisma.identityReview.findUnique({ where: { id: reviewId }, select: { evidences: true } });
        if (!review || !isBatchable(review.evidences)) {
          results.push({ reviewId, outcome: 'SKIPPED', error: 'Não pode ser aprovada em lote.' });
          continue;
        }
        const { outcome } = await this.resolveAuditReview(reviewId, 'MERGE', reviewedById);
        results.push({ reviewId, outcome });
      } catch (err: any) {
        results.push({ reviewId, outcome: 'FAILED', error: err.message });
      }
    }
    return results;
  }

  /**
   * Unifica duas Persons: a origem (sourcePersonId) é absorvida pelo destino (targetPersonId).
   *
   * Garantias:
   *  - Tudo numa única transação.
   *  - Nada é apagado em cascata sem registro: quando as duas pessoas têm Customer na
   *    mesma jornada, TODOS os registros do Customer redundante são movidos
   *    (interações, tarefas, oportunidades, produtos, execuções de fluxo, audiência
   *    e matrículas de campanha, eventos de domínio). Só depois o Customer vazio é
   *    removido — e a remoção é abortada se ainda restar qualquer registro ligado.
   *  - Linhas que colidem com restrição única (mesma campanha já existente no destino)
   *    ficam com a versão do destino; a da origem é removida e guardada por inteiro
   *    no MergeEvent.
   *  - O MergeEvent.metadata (version 2) registra o necessário para desfazer:
   *    snapshot da Person e dos Customers removidos, IDs movidos por tabela e
   *    linhas removidas por colisão.
   *
   * `inTransaction` permite concluir outra gravação (ex.: fechar a revisão) na mesma transação.
   * Retorna o id do MergeEvent.
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
    },
    inTransaction?: (tx: Prisma.TransactionClient) => Promise<void>,
    context?: { reviewId?: string }
  ): Promise<string> {
    if (sourcePersonId === targetPersonId) {
      throw new Error('Não é possível mesclar uma identidade consigo mesma.');
    }

    const snapshot = <T>(row: T) => JSON.parse(JSON.stringify(row));

    return prisma.$transaction(async (tx) => {
      const sourcePerson = await tx.person.findUnique({
        where: { id: sourcePersonId },
        include: { identityAliases: { select: { id: true } }, customers: true }
      });
      const targetPerson = await tx.person.findUnique({
        where: { id: targetPersonId },
        include: { customers: true }
      });

      if (!sourcePerson || !targetPerson) {
        throw new Error('Uma ou ambas as identidades para fusão não foram encontradas.');
      }

      const { identityAliases, customers, ...sourcePersonRow } = sourcePerson;
      const undo = {
        version: 2,
        sourcePerson: snapshot(sourcePersonRow),
        targetBefore: { fullName: targetPerson.fullName, email: targetPerson.email, phoneNumber: targetPerson.phoneNumber },
        movedAliasIds: identityAliases.map(a => a.id),
        repointedCustomerIds: [] as string[],
        mergedCustomers: [] as any[],
        domainEventIdsRepointed: [] as string[],
        reviewIdsRepointed: [] as string[],
        reviewId: context?.reviewId ?? null,
        canonicalOverridesApplied: {} as Record<string, string | null>,
      };

      // 1. Aliases passam para o destino
      await tx.identityAlias.updateMany({
        where: { personId: sourcePersonId },
        data: { personId: targetPersonId }
      });

      // 2. Customers
      for (const sourceCust of customers) {
        const conflictingCust = targetPerson.customers.find(c => c.journeyId === sourceCust.journeyId);

        if (!conflictingCust) {
          await tx.customer.update({ where: { id: sourceCust.id }, data: { personId: targetPersonId } });
          undo.repointedCustomerIds.push(sourceCust.id);
          continue;
        }

        // Mesma jornada nos dois lados: move tudo para o Customer do destino
        const from = { customerId: sourceCust.id };
        const to = { customerId: conflictingCust.id };
        const ids = async (rows: Promise<{ id: string }[]>) => (await rows).map(r => r.id);

        const moved = {
          interaction: await ids(tx.interaction.findMany({ where: from, select: { id: true } })),
          task: await ids(tx.task.findMany({ where: from, select: { id: true } })),
          opportunity: await ids(tx.opportunity.findMany({ where: from, select: { id: true } })),
          customerProduct: await ids(tx.customerProduct.findMany({ where: from, select: { id: true } })),
          flowExecution: await ids(tx.flowExecution.findMany({ where: from, select: { id: true } })),
          domainEvent: await ids(tx.domainEvent.findMany({ where: from, select: { id: true } })),
          campaignAudienceMember: [] as string[],
          campaignEnrollment: [] as string[],
        };
        await tx.interaction.updateMany({ where: from, data: to });
        await tx.task.updateMany({ where: from, data: to });
        await tx.opportunity.updateMany({ where: from, data: to });
        await tx.customerProduct.updateMany({ where: from, data: to });
        await tx.flowExecution.updateMany({ where: from, data: to });
        await tx.domainEvent.updateMany({ where: from, data: to });

        // Audiência: única por (campanha, customer)
        const droppedAudience: any[] = [];
        const targetAudience = new Set(
          (await tx.campaignAudienceMember.findMany({ where: to, select: { campaignId: true } })).map(a => a.campaignId)
        );
        for (const member of await tx.campaignAudienceMember.findMany({ where: from })) {
          if (targetAudience.has(member.campaignId)) {
            droppedAudience.push(snapshot(member));
            await tx.campaignAudienceMember.delete({ where: { id: member.id } });
          } else {
            await tx.campaignAudienceMember.update({ where: { id: member.id }, data: to });
            moved.campaignAudienceMember.push(member.id);
          }
        }

        // Matrículas: únicas por (campanha, customer, isTest)
        const droppedEnrollments: any[] = [];
        const targetEnrollments = new Set(
          (await tx.campaignEnrollment.findMany({ where: to, select: { campaignId: true, isTest: true } }))
            .map(e => `${e.campaignId}:${e.isTest}`)
        );
        for (const enrollment of await tx.campaignEnrollment.findMany({ where: from })) {
          if (targetEnrollments.has(`${enrollment.campaignId}:${enrollment.isTest}`)) {
            droppedEnrollments.push(snapshot(enrollment));
            await tx.campaignEnrollment.delete({ where: { id: enrollment.id } });
          } else {
            await tx.campaignEnrollment.update({ where: { id: enrollment.id }, data: to });
            moved.campaignEnrollment.push(enrollment.id);
          }
        }

        // Trava de segurança: o Customer só sai se não restar nada ligado a ele (evita perda por cascata)
        const leftovers = (await Promise.all([
          tx.interaction.count({ where: from }),
          tx.task.count({ where: from }),
          tx.opportunity.count({ where: from }),
          tx.customerProduct.count({ where: from }),
          tx.flowExecution.count({ where: from }),
          tx.campaignAudienceMember.count({ where: from }),
          tx.campaignEnrollment.count({ where: from }),
        ])).reduce((sum, n) => sum + n, 0);
        if (leftovers > 0) {
          throw new Error(`Fusão abortada: o Customer ${sourceCust.id} ainda tem ${leftovers} registro(s) ligado(s).`);
        }

        undo.mergedCustomers.push({
          sourceCustomer: snapshot(sourceCust),
          intoCustomerId: conflictingCust.id,
          moved,
          droppedAudience,
          droppedEnrollments,
        });
        await tx.customer.delete({ where: { id: sourceCust.id } });
      }

      // 3. Referências soltas (sem chave estrangeira) à Person de origem
      undo.domainEventIdsRepointed = (await tx.domainEvent.findMany({ where: { personId: sourcePersonId }, select: { id: true } })).map(e => e.id);
      await tx.domainEvent.updateMany({ where: { personId: sourcePersonId }, data: { personId: targetPersonId } });
      undo.reviewIdsRepointed = (await tx.identityReview.findMany({ where: { candidatePersonId: sourcePersonId }, select: { id: true } })).map(r => r.id);
      await tx.identityReview.updateMany({ where: { candidatePersonId: sourcePersonId }, data: { candidatePersonId: targetPersonId } });

      // 4. Sobreposição de dados canônicos escolhidos pelo Admin
      if (canonicalOverrides) {
        const updates: Prisma.PersonUpdateInput = {};
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
          await tx.person.update({ where: { id: targetPersonId }, data: updates });
          undo.canonicalOverridesApplied = updates as Record<string, string | null>;
        }
      }

      // 5. Trilha de auditoria e reversão
      const mergeEvent = await tx.mergeEvent.create({
        data: { sourcePersonId, targetPersonId, decidedById, reason, metadata: undo }
      });

      // 6. Remove a Person absorvida (aliases e customers já foram re-apontados)
      await tx.person.delete({ where: { id: sourcePersonId } });

      if (inTransaction) await inTransaction(tx);

      console.log(`[IdentityMatchingService] Fusão concluída: Person ${sourcePersonId} mesclada em ${targetPersonId} (MergeEvent ${mergeEvent.id})`);
      return mergeEvent.id;
    }, { maxWait: 15000, timeout: 60000 });
  }
}

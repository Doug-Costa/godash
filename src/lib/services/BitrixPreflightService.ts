import prisma from '@/lib/prisma';
import { 
  BitrixRawContactRow, 
  BitrixRawDealRow, 
  BitrixOperatorMap, 
  BitrixProductMapRule,
  BitrixPreflightSummary,
  BitrixProcessedDeal
} from '@/lib/domain/BitrixImportContract';
import { BitrixParserService } from './BitrixParserService';
import { BitrixIdentityResolver } from './BitrixIdentityResolver';
import { BitrixDealClassifier } from './BitrixDealClassifier';
import { BitrixProductResolver } from './BitrixProductResolver';
import { BitrixOperatorMapper } from './BitrixOperatorMapper';

export class BitrixPreflightService {
  /**
   * Executa simulação 100% em memória (Preflight) dos dois arquivos Bitrix (Contatos + Negócios)
   * sem persistir nada nem disparar qualquer efeito colateral.
   */
  static async simulate(params: {
    contacts: BitrixRawContactRow[];
    deals: BitrixRawDealRow[];
    operatorMaps?: BitrixOperatorMap[];
    productRules?: BitrixProductMapRule[];
    recencyCutoffDays?: number;
  }): Promise<{ summary: BitrixPreflightSummary; processedDeals: BitrixProcessedDeal[] }> {
    const { contacts, deals, operatorMaps = [], productRules = [], recencyCutoffDays = 90 } = params;
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - (recencyCutoffDays * 24 * 60 * 60 * 1000));

    // 1. Indexar Contatos por ID do Bitrix
    const contactsMap = new Map<string, BitrixRawContactRow>();
    let contactsWithoutStrongId = 0;

    for (const c of contacts) {
      if (c.id) {
        contactsMap.set(String(c.id).trim(), c);
      }
      const email = BitrixParserService.sanitizeEmail(c.email);
      const phone = BitrixParserService.sanitizePhone(c.phone);
      if (!email && !phone) {
        contactsWithoutStrongId++;
      }
    }

    // 2. Coletar e-mails e telefones para estimar matches com a base atual do CRM
    const sampleEmails = contacts
      .map(c => BitrixParserService.sanitizeEmail(c.email))
      .filter((e): e is string => Boolean(e));

    const samplePhones = contacts
      .map(c => BitrixParserService.sanitizePhone(c.phone))
      .filter((p): p is string => Boolean(p));

    let existingMatches = 0;
    if (sampleEmails.length > 0 || samplePhones.length > 0) {
      const existingPersons = await prisma.person.count({
        where: {
          OR: [
            sampleEmails.length > 0 ? { email: { in: sampleEmails.slice(0, 1000) } } : {},
            samplePhones.length > 0 ? { phoneNumber: { in: samplePhones.slice(0, 1000) } } : {}
          ]
        }
      });
      existingMatches = existingPersons;
    }

    // 3. Processar Deals
    const processedDeals: BitrixProcessedDeal[] = [];
    let dealsLinkedToContact = 0;
    let dealsRecoveredFromSnapshot = 0;
    let dealsWithoutContact = 0;
    let dealsWonArchived = 0;
    let dealsLostArchived = 0;
    let dealsStandBy = 0;
    let dealsOperationalActive = 0;
    let dealsDormantArchived = 0;
    let productsConfirmed = 0;
    let productsPendingMapping = 0;

    for (const deal of deals) {
      // Resolução de Contato
      const contactRes = BitrixIdentityResolver.resolveDealContact(deal, contactsMap);
      if (contactRes.status === 'LINKED_EXISTING') {
        dealsLinkedToContact++;
      } else if (contactRes.status === 'RECOVERED_FROM_SNAPSHOT') {
        dealsRecoveredFromSnapshot++;
      } else {
        dealsWithoutContact++;
      }

      // Classificação e Recência
      const classRes = BitrixDealClassifier.classify(deal, recencyCutoffDays, now);
      if (classRes.classification === 'WON') dealsWonArchived++;
      else if (classRes.classification === 'LOST') dealsLostArchived++;
      else if (classRes.classification === 'STAND_BY') dealsStandBy++;
      else if (classRes.classification === 'OPEN_ACTIVE') dealsOperationalActive++;
      else if (classRes.classification === 'OPEN_DORMANT') dealsDormantArchived++;

      // Resolução de Produto
      const prodRes = BitrixProductResolver.resolve(deal, productRules);
      if (prodRes.level === 'CONFIRMED_PRODUCT') {
        productsConfirmed++;
      } else {
        productsPendingMapping++;
      }

      // Mapeamento de Operador
      const opRes = BitrixOperatorMapper.mapOperator(deal.assignedByName || deal.assignedById, operatorMaps);

      const value = BitrixParserService.parseValue(deal.opportunity);
      const createdAt = deal.dateCreate ? new Date(deal.dateCreate) : now;
      const updatedAt = deal.dateModify ? new Date(deal.dateModify) : createdAt;

      processedDeals.push({
        bitrixDealId: String(deal.id),
        bitrixContactId: deal.contactId ? String(deal.contactId) : undefined,
        personResolved: contactRes.person ? {
          ...contactRes.person,
          recoveredFromSnapshot: contactRes.recoveredFromSnapshot
        } : null,
        classification: classRes.classification,
        operationalVisibility: contactRes.status === 'REVIEW_REQUIRED' 
          ? 'REVIEW_REQUIRED' 
          : classRes.operationalVisibility,
        reviewReason: contactRes.reviewReason,
        stage: classRes.stage,
        status: classRes.status,
        value,
        assignedToUserId: opRes.assignedToUserId,
        humanTakeover: opRes.humanTakeover,
        productResolution: prodRes,
        createdAt: isNaN(createdAt.getTime()) ? now : createdAt,
        updatedAt: isNaN(updatedAt.getTime()) ? now : updatedAt,
        utm: {
          source: deal.utmSource,
          medium: deal.utmMedium,
          campaign: deal.utmCampaign,
          content: deal.utmContent,
          term: deal.utmTerm
        },
        metadata: {
          legacySource: 'BITRIX',
          legacyDealTitle: deal.title,
          legacyStageId: deal.stageId,
          legacyPipelineId: deal.pipelineId,
          legacyComments: deal.comments,
          legacyLossReason: deal.lossReason,
          raw: deal.raw
        }
      });
    }

    const estimatedNewPersons = Math.max(0, contacts.length + dealsRecoveredFromSnapshot - existingMatches);

    const summary: BitrixPreflightSummary = {
      totalContactsRead: contacts.length,
      estimatedNewPersons,
      estimatedMatches: existingMatches,
      identityReviewsPending: 0,
      contactsWithoutStrongId,
      totalDealsRead: deals.length,
      dealsLinkedToContact,
      dealsRecoveredFromSnapshot,
      dealsWithoutContact,
      dealsWonArchived,
      dealsLostArchived,
      dealsStandBy,
      dealsOperationalActive,
      dealsDormantArchived,
      productsConfirmed,
      productsPendingMapping,
      emailsWillSend: 0,
      flowsWillTrigger: 0,
      campaignsWillTrigger: 0,
      roundRobinWillExecute: 0,
      inadvertentLtvChange: 0,
      recencyCutoffDays,
      cutoffDate: cutoffDate.toISOString().split('T')[0]
    };

    return { summary, processedDeals };
  }
}

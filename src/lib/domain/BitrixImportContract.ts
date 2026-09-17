export interface BitrixRawContactRow {
  id: string; // ID do contato no Bitrix
  name?: string;
  lastName?: string;
  secondName?: string;
  email?: string;
  phone?: string;
  cpf?: string;
  source?: string;
  assignedById?: string;
  assignedByName?: string;
  dateCreate?: string;
  dateModify?: string;
  comments?: string;
  raw?: Record<string, any>;
}

export interface BitrixRawDealRow {
  id: string; // ID do negócio no Bitrix
  title?: string;
  stageId?: string; // e.g. "C1:WON", "WON", "C1:LOSE", "LOSE", "C1:NEW", etc.
  stageSemanticId?: string; // "S" (Success/Won), "F" (Failed/Lost), "P" (Progress/Open)
  contactId?: string; // ID do contato vinculado
  // Campos expandidos na ausência do contactId ou snapshot do contato
  contactName?: string;
  contactLastName?: string;
  contactEmail?: string;
  contactPhone?: string;
  
  opportunity?: number | string; // Valor financeiro
  currency?: string;
  assignedById?: string;
  assignedByName?: string;
  sourceId?: string;
  dateCreate?: string;
  dateModify?: string;
  closeDate?: string;
  pipelineId?: string;
  formId?: string;
  interestArea?: string;
  lossReason?: string;
  comments?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  raw?: Record<string, any>;
}

export interface BitrixOperatorMap {
  bitrixNameOrId: string;
  crmUserId: string;
  crmUserName: string;
  active: boolean;
}

export interface BitrixProductMapRule {
  bitrixFormId?: string;
  bitrixTitlePattern?: string;
  bitrixInterestArea?: string;
  crmProductId: string;
}

export type BitrixDealClassification = 'WON' | 'LOST' | 'OPEN_ACTIVE' | 'OPEN_DORMANT' | 'STAND_BY';

export interface BitrixProcessedDeal {
  bitrixDealId: string;
  bitrixContactId?: string;
  personResolved: {
    fullName: string;
    email?: string;
    phone?: string;
    cpf?: string;
    source: string;
    recoveredFromSnapshot: boolean;
  } | null;
  classification: BitrixDealClassification;
  operationalVisibility: 'OPERATIONAL' | 'ARCHIVED' | 'REVIEW_REQUIRED';
  reviewReason?: 'DEAL_WITHOUT_CONTACT' | 'AMBIGUOUS_IDENTITY' | 'UNMAPPED_OPERATOR';
  stage: string;
  status: 'OPEN' | 'WON' | 'LOST';
  value: number;
  assignedToUserId?: string;
  humanTakeover: boolean;
  productResolution: {
    level: 'CONFIRMED_PRODUCT' | 'INTEREST_TAG' | 'LEGACY_TITLE';
    productId?: string;
    interestTags: string[];
    legacyDealTitle: string;
  };
  createdAt: Date;
  updatedAt: Date;
  utm: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
  metadata: Record<string, any>;
}

export interface BitrixPreflightSummary {
  // Contatos
  totalContactsRead: number;
  estimatedNewPersons: number;
  estimatedMatches: number;
  identityReviewsPending: number;
  contactsWithoutStrongId: number;

  // Negócios
  totalDealsRead: number;
  dealsLinkedToContact: number;
  dealsRecoveredFromSnapshot: number; // Ex: até 707
  dealsWithoutContact: number; // Ex: 26 (Review Required)
  
  // Oportunidades Classificadas
  dealsWonArchived: number;
  dealsLostArchived: number;
  dealsStandBy: number;
  dealsOperationalActive: number;
  dealsDormantArchived: number;

  // Produtos
  productsConfirmed: number;
  productsPendingMapping: number;

  // Cinto de Segurança
  emailsWillSend: 0;
  flowsWillTrigger: 0;
  campaignsWillTrigger: 0;
  roundRobinWillExecute: 0;
  inadvertentLtvChange: 0;

  // Configuração usada na simulação
  recencyCutoffDays: number;
  cutoffDate: string;
}

export type InteractionType =
  | 'CONTACT_ATTEMPT'
  | 'MEETING_SCHEDULED'
  | 'LOST'
  | 'RECOVERED'
  | 'CONTACTED'
  | 'FOLLOW_UP';

export type LossReason =
  | 'PRICE_TOO_HIGH'
  | 'MISSING_CONTENT'
  | 'GHOSTING'
  | 'UNQUALIFIED'
  | 'PRICE'
  | 'NO_RESPONSE'
  | 'DISCARD';

export type LeadTag = 'BOOK_CLIENT' | 'ABANDONED_CART' | 'CANCELED_CLIENT';

export interface CrmCustomer {
  id?: string;
  externalPersonId: number | null;
  stage: string;
  assigneeId?: string | null;
  pipelineId?: string | null;
  journeyId?: string | null;
  joinedJourneyAt?: Date | null;
  metadata?: any; // JSONB metadata
  createdAt?: Date;
  updatedAt?: Date;
  lastInteractionAt?: Date | null;
  interactionCount: number;
  lossReason?: string | null;
  tag?: string | null;
  scheduledFor?: Date | null;
  frozenUntil?: Date | null;
  freezeReason?: string | null;
  humanTakeover?: boolean;
  lostReason?: string | null;
}

export interface CrmInteraction {
  id: string;
  customerId: string;
  text: string;
  authorId: string | null;
  createdAt: Date;
}

export interface ICrmRepository {
  getCustomer(idOrExtId: string | number | null, journeyId?: string | null): Promise<CrmCustomer | null>;
  getManyCustomers(externalPersonIds: number[]): Promise<CrmCustomer[]>;
  updateStage(idOrExtId: string | number | null, newStage: string, journeyId?: string | null): Promise<CrmCustomer>;
  assignLead(idOrExtId: string | number | null, assigneeId: string | null, journeyId?: string | null): Promise<CrmCustomer>;
  addInteraction(idOrExtId: string | number | null, text: string, authorId: string | null, journeyId?: string | null): Promise<CrmInteraction>;
  getInteractions(idOrExtId: string | number | null, journeyId?: string | null): Promise<CrmInteraction[]>;
  
  // DDD actions
  updateCustomer(idOrExtId: string | number | null, data: Partial<CrmCustomer>, journeyId?: string | null): Promise<CrmCustomer>;
  getCustomersByLossReason(reason: LossReason): Promise<CrmCustomer[]>;
  getCustomersByTag(tag: LeadTag): Promise<CrmCustomer[]>;
  getExpiredSlaCustomers(days: number): Promise<CrmCustomer[]>;
}

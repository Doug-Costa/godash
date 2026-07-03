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
  | 'NO_RESPONSE';

export type LeadTag = 'BOOK_CLIENT' | 'ABANDONED_CART';

export interface CrmLeadState {
  externalPersonId: number;
  stage: string;
  assigneeId?: string | null;
  lastInteractionAt?: Date | null;
  interactionCount: number;
  lossReason?: string | null;
  tag?: string | null;
  scheduledFor?: Date | null;
}

export interface CrmLeadInteraction {
  id: string;
  leadStateExternalId: number;
  text: string;
  authorId: string;
  createdAt: Date;
}

export interface ICrmRepository {
  getLeadState(externalPersonId: number): Promise<CrmLeadState | null>;
  getManyLeadStates(externalPersonIds: number[]): Promise<CrmLeadState[]>;
  updateStage(externalPersonId: number, newStage: string): Promise<CrmLeadState>;
  assignLead(externalPersonId: number, assigneeId: string | null): Promise<CrmLeadState>;
  addInteraction(externalPersonId: number, text: string, authorId: string): Promise<CrmLeadInteraction>;
  getInteractions(externalPersonId: number): Promise<CrmLeadInteraction[]>;
  
  // New DDD actions
  updateLeadState(externalPersonId: number, data: Partial<CrmLeadState>): Promise<CrmLeadState>;
  getLeadsByLossReason(reason: LossReason): Promise<CrmLeadState[]>;
  getLeadsByTag(tag: LeadTag): Promise<CrmLeadState[]>;
  getExpiredSlaLeads(days: number): Promise<CrmLeadState[]>;
}


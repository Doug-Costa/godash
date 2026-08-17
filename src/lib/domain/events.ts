export const DomainEventType = {
  // Leads & Opportunities
  LEAD_CAPTURED: 'LEAD_CAPTURED',
  OPPORTUNITY_CREATED: 'OPPORTUNITY_CREATED',
  OPPORTUNITY_STAGE_CHANGED: 'OPPORTUNITY_STAGE_CHANGED',
  OPPORTUNITY_WON: 'OPPORTUNITY_WON',
  OPPORTUNITY_LOST: 'OPPORTUNITY_LOST',

  // SLA & Rotatividade
  CUSTOMER_ASSIGNED: 'CUSTOMER_ASSIGNED',
  CUSTOMER_ROTATED: 'CUSTOMER_ROTATED',
  CUSTOMER_FROZEN: 'CUSTOMER_FROZEN',
  CUSTOMER_UNFROZEN: 'CUSTOMER_UNFROZEN',

  // Interações
  CALL_STARTED: 'CALL_STARTED',
  CALL_COMPLETED: 'CALL_COMPLETED',
  EMAIL_SENT: 'EMAIL_SENT',
  WHATSAPP_SENT: 'WHATSAPP_SENT',

  // Produto e RevOps
  PURCHASE_REGISTERED: 'PURCHASE_REGISTERED',
  SUBSCRIPTION_STARTED: 'SUBSCRIPTION_STARTED',
  SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',

  // Integrações & Flows
  IMPORT_COMPLETED: 'IMPORT_COMPLETED',
  IDENTITY_LINKED: 'IDENTITY_LINKED',
  PRODUCT_ALIAS_CREATED: 'PRODUCT_ALIAS_CREATED',
  FLOW_COMPLETED: 'FLOW_COMPLETED'
} as const;

export type DomainEventTypeValue = typeof DomainEventType[keyof typeof DomainEventType];

export const ActorType = {
  USER: 'USER',
  SYSTEM: 'SYSTEM',
  WORKER: 'WORKER',
  IMPORT: 'IMPORT',
  WEBHOOK: 'WEBHOOK',
  AUTOMATION: 'AUTOMATION'
} as const;

export type ActorTypeValue = typeof ActorType[keyof typeof ActorType];

export interface CreateDomainEventInput {
  type: DomainEventTypeValue;
  personId?: string | null;
  customerId?: string | null;
  opportunityId?: string | null;
  campaignId?: string | null;
  productId?: string | null;
  actorType: ActorTypeValue;
  actorId?: string | null;
  correlationId?: string | null;
  causationId?: string | null;
  metadata?: Record<string, any>;
}

import { InteractionType, LossReason, LeadTag } from './crm.types';

export interface LeadInteractionRecordedEvent {
  eventName: 'LeadInteractionRecordedEvent';
  externalPersonId: number | null;
  customerId?: string;
  type: InteractionType;
  authorId: string;
  stage: string;
  lossReason?: LossReason;
  timestamp: Date;
}

export interface LeadRecycledByInactivityEvent {
  eventName: 'LeadRecycledByInactivityEvent';
  externalPersonId: number | null;
  customerId?: string;
  previousAssigneeId: string | null;
  previousStage: string;
  timestamp: Date;
}

export interface LeadTaggedEvent {
  eventName: 'LeadTaggedEvent';
  externalPersonId: number | null;
  customerId?: string;
  tag: LeadTag;
  timestamp: Date;
}

export interface LeadAutomationResumedEvent {
  eventName: 'LeadAutomationResumedEvent';
  externalPersonId: number | null;
  customerId?: string;
  authorId: string;
  timestamp: Date;
}

export type CrmEvent = 
  | LeadInteractionRecordedEvent
  | LeadRecycledByInactivityEvent
  | LeadTaggedEvent
  | LeadAutomationResumedEvent;

export class CrmEventDispatcher {
  static dispatch(event: CrmEvent) {
    console.log(`[Domain Event Dispatcher] Dispatched event: ${event.eventName}`, JSON.stringify(event));
  }
}

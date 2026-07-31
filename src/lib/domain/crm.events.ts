import { InteractionType, LossReason, LeadTag } from './crm.types';

export interface LeadInteractionRecordedEvent {
  eventName: 'LeadInteractionRecordedEvent';
  externalPersonId: number;
  type: InteractionType;
  authorId: string;
  stage: string;
  lossReason?: LossReason;
  timestamp: Date;
}

export interface LeadRecycledByInactivityEvent {
  eventName: 'LeadRecycledByInactivityEvent';
  externalPersonId: number;
  previousAssigneeId: string | null;
  previousStage: string;
  timestamp: Date;
}

export interface LeadTaggedEvent {
  eventName: 'LeadTaggedEvent';
  externalPersonId: number;
  tag: LeadTag;
  timestamp: Date;
}

export interface LeadAutomationResumedEvent {
  eventName: 'LeadAutomationResumedEvent';
  externalPersonId: number;
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

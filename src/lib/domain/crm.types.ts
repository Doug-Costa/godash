export interface CrmLeadState {
  externalPersonId: number;
  stage: string;
  assigneeId?: string | null;
}

export interface CrmLeadInteraction {
  id: string;
  leadStateExternalId: number;
  text: string;
  authorId: string;
  createdAt: Date;
}

export interface ICrmRepository {
  getManyLeadStates(externalPersonIds: number[]): Promise<CrmLeadState[]>;
  updateStage(externalPersonId: number, newStage: string): Promise<CrmLeadState>;
  assignLead(externalPersonId: number, assigneeId: string): Promise<CrmLeadState>;
  addInteraction(externalPersonId: number, text: string, authorId: string): Promise<CrmLeadInteraction>;
  getInteractions(externalPersonId: number): Promise<CrmLeadInteraction[]>;
}

export interface CampaignPolicyInput {
  campaignNature: string;
  pipelineId?: string | null;
  routingMode: string;
  hasPublishedFlow: boolean;
  flowStepCount: number;
  operators: Array<{ id: string; isActive: boolean }>;
}

export class CampaignPolicyService {
  static validate(input: CampaignPolicyInput) {
    const errors: string[] = [];
    if (input.campaignNature === 'AUTOMATED' && !input.hasPublishedFlow) errors.push('Campanha automática exige um fluxo com versão publicada.');
    if (input.hasPublishedFlow && input.flowStepCount === 0) errors.push('O fluxo publicado não possui passos.');
    if (input.campaignNature === 'COMMERCIAL' && !input.pipelineId) errors.push('Campanha comercial exige funil de destino.');
    if (input.campaignNature === 'COMMERCIAL' && input.routingMode !== 'POOL' && input.operators.length === 0) {
      errors.push('Selecione ao menos um operador para a campanha comercial.');
    }
    const inactive = input.operators.filter(operator => !operator.isActive).length;
    if (inactive) errors.push(`${inactive} operador(es) selecionado(s) estão inativos.`);
    return errors;
  }

  static selectAssignee(input: {
    routingMode: string;
    operatorIds: string[];
    index: number;
    fixedAssigneeId?: string;
  }): string | null {
    if (input.routingMode === 'POOL') return null;
    if (input.fixedAssigneeId && input.operatorIds.includes(input.fixedAssigneeId)) return input.fixedAssigneeId;
    if (!input.operatorIds.length) return null;
    return input.operatorIds[input.index % input.operatorIds.length];
  }
}

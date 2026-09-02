import { describe, expect, it } from 'vitest';
import { CampaignPolicyService } from './CampaignPolicyService';

describe('CampaignPolicyService', () => {
  it('permite campanha comercial sem automação, mas exige funil e operador no preflight', () => {
    const errors = CampaignPolicyService.validate({
      campaignNature: 'COMMERCIAL', pipelineId: null, routingMode: 'ROUND_ROBIN',
      hasPublishedFlow: false, flowStepCount: 0, operators: []
    });
    expect(errors).toHaveLength(2);
  });

  it('garante atribuição ao operador específico no teste controlado', () => {
    expect(CampaignPolicyService.selectAssignee({
      routingMode: 'ROUND_ROBIN', operatorIds: ['ana', 'joao'], index: 0, fixedAssigneeId: 'joao'
    })).toBe('joao');
  });

  it('mantém campanha POOL sem responsável até o pickup', () => {
    expect(CampaignPolicyService.selectAssignee({ routingMode: 'POOL', operatorIds: ['ana'], index: 0 })).toBeNull();
  });
});

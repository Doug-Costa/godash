import { describe, expect, it } from 'vitest';
import { CustomerRelationshipService } from './CustomerRelationshipService';

describe('CustomerRelationshipService', () => {
  it('distingue lead sem compra', () => {
    expect(CustomerRelationshipService.classify({ opportunityStatuses: ['OPEN'] })).toBe('LEAD');
  });

  it('distingue cliente com nova oportunidade', () => {
    expect(CustomerRelationshipService.classify({ productStatuses: ['ACTIVE'], opportunityStatuses: ['OPEN'] })).toBe('CUSTOMER_AND_LEAD');
  });

  it('mantém cancelado como ex-cliente', () => {
    expect(CustomerRelationshipService.classify({ productStatuses: ['CANCELED'] })).toBe('FORMER_CUSTOMER');
  });
});

export type CustomerRelationshipType = 'LEAD' | 'CUSTOMER' | 'CUSTOMER_AND_LEAD' | 'FORMER_CUSTOMER' | 'CONTACT';

export class CustomerRelationshipService {
  static classify(input: {
    productStatuses?: string[];
    opportunityStatuses?: string[];
    subscriptionStatus?: string | null;
  }): CustomerRelationshipType {
    const products = (input.productStatuses || []).map(status => status.toUpperCase());
    const opportunities = (input.opportunityStatuses || []).map(status => status.toUpperCase());
    const subscription = (input.subscriptionStatus || '').toLowerCase();
    const hasActivePurchase = products.some(status => status === 'ACTIVE' || status === 'COMPLETED') || subscription === 'active';
    const hasHistoricalPurchase = products.length > 0 || subscription === 'canceled' || subscription === 'expired';
    const hasOpenOpportunity = opportunities.includes('OPEN');

    if (hasActivePurchase && hasOpenOpportunity) return 'CUSTOMER_AND_LEAD';
    if (hasActivePurchase) return 'CUSTOMER';
    if (hasOpenOpportunity) return 'LEAD';
    if (hasHistoricalPurchase) return 'FORMER_CUSTOMER';
    return 'CONTACT';
  }
}

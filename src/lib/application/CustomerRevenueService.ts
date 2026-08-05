import prisma from '@/lib/prisma';

export class CustomerRevenueService {
  /**
   * Recalculates and updates the total lifetime value (LTV) for a given customer.
   * Sums pricePaid from CustomerProduct AND value from WON Opportunities.
   */
  static async recalculateLTV(customerId: string): Promise<number> {
    const productSum = await prisma.customerProduct.aggregate({
      where: { customerId, status: 'ACTIVE' },
      _sum: {
        pricePaid: true
      }
    });

    const opportunitySum = await prisma.opportunity.aggregate({
      where: { customerId, status: 'WON' },
      _sum: {
        value: true
      }
    });

    const newLTV = (productSum._sum.pricePaid || 0) + (opportunitySum._sum.value || 0);

    await prisma.customer.update({
      where: { id: customerId },
      data: {
        totalLifetimeValue: newLTV
      }
    });

    console.log(`[RevOps LTV] Customer ${customerId} LTV recalculated to R$ ${newLTV.toFixed(2)} (Products: R$ ${(productSum._sum.pricePaid || 0).toFixed(2)}, Deals: R$ ${(opportunitySum._sum.value || 0).toFixed(2)})`);
    return newLTV;
  }

  /**
   * Registers a product purchase for a customer, adding it to CustomerProduct and recalculating LTV.
   */
  static async registerPurchase(params: {
    customerId: string;
    productId: string;
    pricePaid: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<void> {
    const { customerId, productId, pricePaid, startDate = new Date(), endDate } = params;

    await prisma.customerProduct.create({
      data: {
        customerId,
        productId,
        pricePaid,
        startDate,
        endDate,
        status: 'ACTIVE'
      }
    });

    await this.recalculateLTV(customerId);
  }
}

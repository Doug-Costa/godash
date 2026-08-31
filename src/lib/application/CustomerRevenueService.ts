import prisma from '@/lib/prisma';
import { SaleChannel } from '@prisma/client';

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
    validUntil?: Date | null;
    authorId?: string;
    source?: string;
    saleChannel?: SaleChannel;
    status?: 'ACTIVE' | 'CANCELED' | 'COMPLETED' | 'EXPIRED';
  }) {
    const { customerId, productId, pricePaid, startDate = new Date(), endDate, validUntil, authorId, source, saleChannel, status = 'ACTIVE' } = params;

    let resolvedSaleChannel: SaleChannel | undefined = saleChannel;
    if (!resolvedSaleChannel && source) {
      if (source.toLowerCase().includes('form') || source.toLowerCase().includes('capture')) {
        resolvedSaleChannel = SaleChannel.INBOUND_FORM;
      } else if (source.toLowerCase().includes('balcao') || source.toLowerCase().includes('manual') || source.toLowerCase().includes('tele')) {
        resolvedSaleChannel = SaleChannel.TELEVENDAS;
      } else if (source.toLowerCase().includes('evento')) {
        resolvedSaleChannel = SaleChannel.EVENTO_PRESENCIAL;
      } else if (source.toLowerCase().includes('site') || source.toLowerCase().includes('web')) {
        resolvedSaleChannel = SaleChannel.SITE;
      }
    }

    const cp = await prisma.customerProduct.create({
      data: {
        customerId,
        productId,
        pricePaid,
        startDate,
        endDate,
        validUntil: validUntil !== undefined ? validUntil : null,
        saleChannel: resolvedSaleChannel || null,
        status
      },
      include: {
        product: true
      }
    });

    await this.recalculateLTV(customerId);

    // Log interaction
    try {
      await prisma.interaction.create({
        data: {
          customerId,
          type: 'SYSTEM',
          text: `Produto "${cp.product?.name || productId}" registrado (${source || 'N/A'}). Valor: R$ ${(pricePaid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          authorId: authorId || null
        }
      });
    } catch (e) {
      console.error('Error logging purchase interaction:', e);
    }

    return cp;
  }
}

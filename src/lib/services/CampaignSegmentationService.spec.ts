// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CampaignSegmentationService } from './CampaignSegmentationService';
import prisma from '@/lib/prisma';
import { ProductCategory, ProductSubType } from '@prisma/client';

vi.mock('@/lib/prisma', () => ({
  default: {
    customer: {
      findMany: vi.fn(),
    }
  }
}));

describe('CampaignSegmentationService', () => {
  let service: CampaignSegmentationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CampaignSegmentationService();
  });

  it('should call prisma findMany with basic pipeline and stage filters', async () => {
    (prisma.customer.findMany as any).mockResolvedValue([]);

    await service.segmentLeads({
      pipelineId: 'pipe-123',
      stage: 'novo_cadastro'
    });

    expect(prisma.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          pipelineId: 'pipe-123',
          stage: 'novo_cadastro'
        })
      })
    );
  });

  it('should format tags filter correctly', async () => {
    (prisma.customer.findMany as any).mockResolvedValue([]);

    await service.segmentLeads({
      tags: ['CANCELED_CLIENT', 'ABANDONED_CART']
    });

    expect(prisma.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tag: { in: ['CANCELED_CLIENT', 'ABANDONED_CART'] }
        })
      })
    );
  });

  it('should use "some" relation filter for purchasedProducts', async () => {
    (prisma.customer.findMany as any).mockResolvedValue([]);

    const startDate = new Date('2026-01-01');
    await service.segmentLeads({
      purchasedProducts: [
        {
          productId: 'prod-1',
          status: 'ACTIVE',
          startDateGe: startDate
        }
      ]
    });

    expect(prisma.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              customerProducts: {
                some: {
                  productId: 'prod-1',
                  status: 'ACTIVE',
                  startDate: { gte: startDate }
                }
              }
            })
          ])
        })
      })
    );
  });

  it('should use "none" relation filter for notPurchasedProducts', async () => {
    (prisma.customer.findMany as any).mockResolvedValue([]);

    await service.segmentLeads({
      notPurchasedProducts: ['prod-abc', 'prod-xyz']
    });

    expect(prisma.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              customerProducts: {
                none: {
                  productId: { in: ['prod-abc', 'prod-xyz'] }
                }
              }
            })
          ])
        })
      })
    );
  });

  it('should query categories and subTypes in purchasedCategories', async () => {
    (prisma.customer.findMany as any).mockResolvedValue([]);

    await service.segmentLeads({
      purchasedCategories: [
        {
          category: ProductCategory.CURSO,
          subType: ProductSubType.ESPECIALIZACAO
        }
      ]
    });

    expect(prisma.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              customerProducts: {
                some: {
                  product: {
                    category: 'CURSO',
                    subType: 'ESPECIALIZACAO'
                  }
                }
              }
            })
          ])
        })
      })
    );
  });
});

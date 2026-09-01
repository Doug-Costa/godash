import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  registerPurchase: vi.fn(),
  resolve: vi.fn(),
  registerAlias: vi.fn(),
  customerFindFirst: vi.fn(),
  customerCreate: vi.fn(),
  customerFindUnique: vi.fn(),
  interactionCreate: vi.fn(),
  opportunityFindFirst: vi.fn(),
  opportunityCreate: vi.fn(),
  pipelineFindUnique: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    customer: { findFirst: mocks.customerFindFirst, create: mocks.customerCreate, findUnique: mocks.customerFindUnique },
    interaction: { create: mocks.interactionCreate },
    opportunity: { findFirst: mocks.opportunityFindFirst, create: mocks.opportunityCreate },
    pipeline: { findUnique: mocks.pipelineFindUnique }
  }
}));
vi.mock('./IdentityResolutionService', () => ({
  IdentityResolutionService: {
    resolve: mocks.resolve,
    registerAlias: mocks.registerAlias,
    normalizeEmail: (value: string) => value,
    normalizePhone: (value: string) => value
  }
}));
vi.mock('./CustomerRevenueService', () => ({ CustomerRevenueService: { registerPurchase: mocks.registerPurchase } }));

import { CustomerCreationService } from './CustomerCreationService';

describe('CustomerCreationService para formulários', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolve.mockResolvedValue({ action: 'FOUND', person: { id: 'person-1' } });
    mocks.customerFindFirst.mockResolvedValue(null);
    mocks.customerCreate.mockResolvedValue({ id: 'customer-1' });
    mocks.customerFindUnique.mockResolvedValue({ id: 'customer-1' });
    mocks.opportunityFindFirst.mockResolvedValue(null);
    mocks.opportunityCreate.mockResolvedValue({ id: 'opp-1' });
    mocks.pipelineFindUnique.mockResolvedValue({ name: 'Vendas' });
  });

  it('cria oportunidade com produto sem registrar compra quando isPurchase=false', async () => {
    await CustomerCreationService.createOrMerge({
      metadata: { fullName: 'Ana', email: 'ana@example.com' },
      source: 'Form Capture: Laminados',
      pipelineId: 'pipeline-1',
      productId: 'product-1',
      isPurchase: false
    });

    expect(mocks.registerPurchase).not.toHaveBeenCalled();
    expect(mocks.opportunityCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ productId: 'product-1', pipelineId: 'pipeline-1' })
    }));
  });
});

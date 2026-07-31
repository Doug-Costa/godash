import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterLeadInteractionService } from './RegisterLeadInteractionService';
import { ICrmRepository, InteractionType } from '@/lib/domain/crm.types';
import prisma from '@/lib/prisma';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  default: {
    customer: {
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    task: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    }
  }
}));

vi.mock('@/lib/db', () => ({
  default: {
    query: vi.fn().mockResolvedValue([[]])
  }
}));

vi.mock('@/lib/services/NotificationService', () => ({
  NotificationService: {
    sendMessage: vi.fn()
  }
}));

vi.mock('@/lib/services/JourneyTransitionService', () => ({
  JourneyTransitionService: {
    handleTransition: vi.fn(),
    mergeCustomerToGeneric: vi.fn()
  }
}));

vi.mock('@/lib/domain/crm.events', () => ({
  CrmEventDispatcher: {
    dispatch: vi.fn()
  }
}));

class MockCrmRepository implements ICrmRepository {
  public customers: any[] = [];
  public interactions: any[] = [];

  async getCustomer(externalPersonId: number, journeyId?: string | null) {
    return this.customers.find(c => c.externalPersonId === externalPersonId && c.journeyId === (journeyId || null)) || null;
  }

  async updateCustomer(externalPersonId: number, data: any, journeyId?: string | null) {
    const idx = this.customers.findIndex(c => c.externalPersonId === externalPersonId && c.journeyId === (journeyId || null));
    if (idx !== -1) {
      this.customers[idx] = { ...this.customers[idx], ...data };
      return this.customers[idx];
    }
    return null;
  }

  async addInteraction(externalPersonId: number, text: string, authorId: string | null, journeyId?: string | null) {
    this.interactions.push({ externalPersonId, text, authorId, journeyId });
    return {} as any;
  }

  async getPipelineIdByName(name: string) {
    return 'pipe-1';
  }
}

describe('RegisterLeadInteractionService - Human Takeover Logic', () => {
  let mockRepo: MockCrmRepository;
  let service: RegisterLeadInteractionService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = new MockCrmRepository();
    service = new RegisterLeadInteractionService(mockRepo as unknown as ICrmRepository);

    mockRepo.customers = [
      {
        id: 'cust-123',
        externalPersonId: 10,
        stage: 'novo_cadastro',
        journeyId: 'journey-1',
        humanTakeover: false
      }
    ];

    (prisma.customer.findFirst as any).mockResolvedValue({
      id: 'cust-123',
      externalPersonId: 10,
      stage: 'novo_cadastro',
      journeyId: 'journey-1',
      humanTakeover: false
    });
  });

  it('should enable humanTakeover and cancel pending automation tasks when a human contacts the lead', async () => {
    await service.execute(10, 'user-1', 'CONTACTED', 'Falei com o cliente', undefined, undefined, 'journey-1');

    // 1. mockRepo should have updated humanTakeover to true
    expect(mockRepo.customers[0].humanTakeover).toBe(true);

    // 2. Pending tasks (automations) should be deleted
    expect(prisma.task.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          customerId: 'cust-123',
          status: 'PENDING',
          taskType: expect.not.stringMatching('RETORNO')
        })
      })
    );

    // 3. Interaction should be recorded
    expect(mockRepo.interactions).toHaveLength(1);
    expect(mockRepo.interactions[0].authorId).toBe('user-1');
  });

  it('should NOT enable humanTakeover for automated system interactions (authorId = null)', async () => {
    // Some automations record interactions with authorId = null or 'system'
    await service.execute(10, null as any, 'FOLLOW_UP', 'Mensagem enviada automaticamente', undefined, undefined, 'journey-1');

    // System interactions should not trigger human takeover
    expect(mockRepo.customers[0].humanTakeover).toBeFalsy();
  });
});

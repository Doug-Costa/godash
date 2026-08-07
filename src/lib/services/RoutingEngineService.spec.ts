// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoutingEngineService } from './RoutingEngineService';
import prisma from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    customer: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    opportunity: {
      findFirst: vi.fn(),
    }
  }
}));

describe('RoutingEngineService', () => {
  let service: RoutingEngineService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RoutingEngineService();
    (prisma.opportunity.findFirst as any).mockResolvedValue(null);
    (prisma.user.findUnique as any).mockResolvedValue(null);
  });

  it('should return null when routing mode is POOL', async () => {
    const nextOperator = await service.determineAssignee(10, {
      routingMode: 'POOL',
      useAccountManager: false,
      strictSkillMatch: false,
      productId: null
    }, 'AGENT', 0, ['user-1', 'user-2']);

    expect(nextOperator).toBeNull();
  });

  it('should select user from account manager priority if active and available', async () => {
    // Mock opportunity having history with active user-2
    (prisma.opportunity.findFirst as any).mockResolvedValue({
      assigneeId: 'user-2'
    });

    // Mock user-2 as active when findUnique is called
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'user-2',
      isActive: true
    });

    const nextOperator = await service.determineAssignee(10, {
      routingMode: 'ROUND_ROBIN',
      useAccountManager: true,
      strictSkillMatch: false,
      productId: null
    }, 'AGENT', 0, ['user-1', 'user-2']);

    expect(nextOperator).toBe('user-2');
  });

  it('should fallback to round robin if account manager is not active/available', async () => {
    // Inactive user-1 means the active account manager query returns null
    (prisma.opportunity.findFirst as any).mockResolvedValue(null);
    (prisma.customer.findFirst as any).mockResolvedValue(null);

    // Mock active users query (findMany with isActive: true) to return only user-2
    (prisma.user.findMany as any).mockResolvedValue([
      { id: 'user-2', isActive: true, role: 'AGENT', name: 'User 2', skills: [] }
    ]);

    // Mock last assign stats
    (prisma.customer.findMany as any).mockResolvedValue([]);

    const nextOperator = await service.determineAssignee(10, {
      routingMode: 'ROUND_ROBIN',
      useAccountManager: true,
      strictSkillMatch: false,
      productId: null
    }, 'AGENT', 0, ['user-1', 'user-2']);

    // Should route to user-2 because user-1 is inactive and only user-2 is active
    expect(nextOperator).toBe('user-2');
  });

  it('should restrict to specialists when strict skill match is enabled', async () => {
    // Mock active operators: user-2 (has skill 'prod-abc')
    (prisma.user.findMany as any).mockResolvedValue([
      { id: 'user-1', isActive: true, role: 'AGENT', name: 'User 1', skills: [] },
      { id: 'user-2', isActive: true, role: 'AGENT', name: 'User 2', skills: ['prod-abc'] }
    ]);

    (prisma.customer.findMany as any).mockResolvedValue([]);

    const nextOperator = await service.determineAssignee(10, {
      routingMode: 'ROUND_ROBIN',
      useAccountManager: false,
      strictSkillMatch: true,
      productId: 'prod-abc'
    }, 'AGENT', 0, ['user-1', 'user-2']);

    expect(nextOperator).toBe('user-2');
  });
});

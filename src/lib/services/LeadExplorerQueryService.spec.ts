import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeadExplorerQueryService } from './LeadExplorerQueryService';

const prismaMocks = vi.hoisted(() => ({
  customerFindMany: vi.fn(),
  customerUpsert: vi.fn(),
  customerUpdateMany: vi.fn(),
  opportunityUpdateMany: vi.fn()
}));

const dbMocks = vi.hoisted(() => ({
  poolQuery: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    customer: {
      findMany: prismaMocks.customerFindMany,
      upsert: prismaMocks.customerUpsert,
      updateMany: prismaMocks.customerUpdateMany
    },
    opportunity: {
      updateMany: prismaMocks.opportunityUpdateMany
    }
  }
}));

vi.mock('@/lib/db', () => ({
  default: {
    query: dbMocks.poolQuery
  }
}));

describe('LeadExplorerQueryService - TDD Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.poolQuery.mockResolvedValue([[]]);
  });

  it('1. Filtra leads por Produto / Curso específico', async () => {
    prismaMocks.customerFindMany.mockResolvedValue([
      {
        id: 'cust-1',
        externalPersonId: 101,
        source: 'Form Capture',
        stage: 'novo_cadastro',
        createdAt: new Date('2026-09-01'),
        person: { fullName: 'Dr. Lucas Resinas', email: 'lucas@resinas.com', phoneNumber: '11999991111' },
        assignee: { id: 'agent-1', name: 'Thais Mazzo', email: 'thais@dentalpress.com.br' },
        journey: null,
        customerProducts: [
          {
            product: { id: 'prod-resinas', name: 'Curso de Imersão em Resinas Compostas', category: 'COURSE' },
            status: 'ACTIVE'
          }
        ],
        opportunities: []
      },
      {
        id: 'cust-2',
        externalPersonId: 102,
        source: 'Form Capture',
        stage: 'novo_cadastro',
        createdAt: new Date('2026-09-02'),
        person: { fullName: 'Dra. Maria Ortodontia', email: 'maria@orto.com', phoneNumber: '11999992222' },
        assignee: null,
        journey: null,
        customerProducts: [
          {
            product: { id: 'prod-orto', name: 'Especialização em Ortodontia', category: 'COURSE' },
            status: 'ACTIVE'
          }
        ],
        opportunities: []
      }
    ]);

    const results = await LeadExplorerQueryService.fetchMatchingLeads({
      productId: 'prod-resinas'
    });

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Dr. Lucas Resinas');
    expect(results[0].productIds).toContain('prod-resinas');
  });

  it('2. Unifica leads do MySQL com leads do Postgres sem duplicidade', async () => {
    dbMocks.poolQuery.mockResolvedValue([
      [
        {
          id: 201,
          fullName: 'Dr. Carlos DentalGO',
          email: 'carlos@dentalgo.com',
          phone: '11988883333',
          createdAt: new Date('2026-08-01'),
          subId: 'sub-1',
          planId: 'plan-premium',
          planTitle: 'Plano Premium Anual',
          subStatus: 'active',
          isValidUntil: new Date('2027-01-01')
        }
      ]
    ]);

    prismaMocks.customerFindMany.mockResolvedValue([
      {
        id: 'cust-carlos',
        externalPersonId: 201,
        source: 'DENTALGO',
        stage: 'primeiro_contato',
        createdAt: new Date('2026-08-01'),
        person: { fullName: 'Dr. Carlos DentalGO', email: 'carlos@dentalgo.com', phoneNumber: '11988883333' },
        assignee: { id: 'agent-2', name: 'Jucelia Ribeiro', email: 'jucelia@dentalpress.com.br' },
        journey: { id: 'camp-1', name: 'Campanha Demo' },
        customerProducts: [],
        opportunities: []
      }
    ]);

    const results = await LeadExplorerQueryService.fetchMatchingLeads({
      source: 'DENTALGO'
    });

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('cust-carlos');
    expect(results[0].planTitle).toBe('Plano Premium Anual');
    expect(results[0].assigneeName).toBe('Jucelia Ribeiro');
    expect(results[0].journeyName).toBe('Campanha Demo');
  });

  it('3. Retorna lista vazia quando nenhum lead corresponde aos filtros', async () => {
    prismaMocks.customerFindMany.mockResolvedValue([]);
    dbMocks.poolQuery.mockResolvedValue([[]]);

    const results = await LeadExplorerQueryService.fetchMatchingLeads({
      search: 'NomeInexistenteXYZ'
    });

    expect(results).toHaveLength(0);
  });
});

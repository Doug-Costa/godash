import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMocks = vi.hoisted(() => ({
  campaignFindUnique: vi.fn(),
  campaignCreate: vi.fn(),
  campaignUpdate: vi.fn(),
  campaignDelete: vi.fn(),
  campaignAudienceMemberUpsert: vi.fn(),
  campaignAudienceMemberFindMany: vi.fn(),
  campaignAudienceMemberUpdateMany: vi.fn(),
  campaignAudienceMemberDeleteMany: vi.fn(),
  campaignEnrollmentUpsert: vi.fn(),
  campaignEnrollmentFindUnique: vi.fn(),
  campaignEnrollmentUpdateMany: vi.fn(),
  campaignEnrollmentDeleteMany: vi.fn(),
  campaignEnrollmentGroupBy: vi.fn(),
  campaignOperatorDeleteMany: vi.fn(),
  campaignOperatorCreateMany: vi.fn(),
  opportunityFindFirst: vi.fn(),
  opportunityCreate: vi.fn(),
  opportunityUpdate: vi.fn(),
  opportunityUpdateMany: vi.fn(),
  formUpdateMany: vi.fn(),
  productUpdateMany: vi.fn(),
  customerFindUnique: vi.fn(),
  customerFindFirst: vi.fn(),
  customerFindMany: vi.fn(),
  customerUpdate: vi.fn(),
  customerUpdateMany: vi.fn(),
  journeyFindUnique: vi.fn(),
  journeyDelete: vi.fn(),
  journeyUpdateMany: vi.fn(),
  taskDeleteMany: vi.fn(),
  recipientLogDeleteMany: vi.fn(),
  automationDeleteMany: vi.fn(),
  flowExecutionCreate: vi.fn(),
  pipelineFindFirst: vi.fn(),
  flowVersionFindFirst: vi.fn(),
  transaction: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    campaign: {
      findUnique: prismaMocks.campaignFindUnique,
      create: prismaMocks.campaignCreate,
      update: prismaMocks.campaignUpdate,
      delete: prismaMocks.campaignDelete
    },
    campaignAudienceMember: {
      upsert: prismaMocks.campaignAudienceMemberUpsert,
      findMany: prismaMocks.campaignAudienceMemberFindMany,
      updateMany: prismaMocks.campaignAudienceMemberUpdateMany,
      deleteMany: prismaMocks.campaignAudienceMemberDeleteMany
    },
    campaignEnrollment: {
      upsert: prismaMocks.campaignEnrollmentUpsert,
      findUnique: prismaMocks.campaignEnrollmentFindUnique,
      updateMany: prismaMocks.campaignEnrollmentUpdateMany,
      deleteMany: prismaMocks.campaignEnrollmentDeleteMany,
      groupBy: prismaMocks.campaignEnrollmentGroupBy
    },
    campaignOperator: {
      deleteMany: prismaMocks.campaignOperatorDeleteMany,
      createMany: prismaMocks.campaignOperatorCreateMany
    },
    opportunity: {
      findFirst: prismaMocks.opportunityFindFirst,
      create: prismaMocks.opportunityCreate,
      update: prismaMocks.opportunityUpdate,
      updateMany: prismaMocks.opportunityUpdateMany
    },
    form: {
      updateMany: prismaMocks.formUpdateMany
    },
    product: {
      updateMany: prismaMocks.productUpdateMany
    },
    customer: {
      findUnique: prismaMocks.customerFindUnique,
      findFirst: prismaMocks.customerFindFirst,
      findMany: prismaMocks.customerFindMany,
      update: prismaMocks.customerUpdate,
      updateMany: prismaMocks.customerUpdateMany
    },
    journey: {
      findUnique: prismaMocks.journeyFindUnique,
      delete: prismaMocks.journeyDelete,
      updateMany: prismaMocks.journeyUpdateMany
    },
    task: {
      deleteMany: prismaMocks.taskDeleteMany
    },
    recipientLog: {
      deleteMany: prismaMocks.recipientLogDeleteMany
    },
    automation: {
      deleteMany: prismaMocks.automationDeleteMany
    },
    flowExecution: {
      create: prismaMocks.flowExecutionCreate
    },
    pipeline: {
      findFirst: prismaMocks.pipelineFindFirst
    },
    flowVersion: {
      findFirst: prismaMocks.flowVersionFindFirst
    },
    $transaction: prismaMocks.transaction
  }
}));

import { CampaignOrchestrationService } from './CampaignOrchestrationService';

describe('CampaignOrchestrationService - TDD Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMocks.transaction.mockImplementation(async (callbackOrArray: any) => {
      if (typeof callbackOrArray === 'function') {
        return callbackOrArray({
          campaign: {
            findUnique: prismaMocks.campaignFindUnique,
            create: prismaMocks.campaignCreate,
            update: prismaMocks.campaignUpdate,
            delete: prismaMocks.campaignDelete
          },
          campaignAudienceMember: {
            upsert: prismaMocks.campaignAudienceMemberUpsert,
            findMany: prismaMocks.campaignAudienceMemberFindMany,
            updateMany: prismaMocks.campaignAudienceMemberUpdateMany,
            deleteMany: prismaMocks.campaignAudienceMemberDeleteMany
          },
          campaignEnrollment: {
            upsert: prismaMocks.campaignEnrollmentUpsert,
            findUnique: prismaMocks.campaignEnrollmentFindUnique,
            updateMany: prismaMocks.campaignEnrollmentUpdateMany,
            deleteMany: prismaMocks.campaignEnrollmentDeleteMany
          },
          campaignOperator: {
            deleteMany: prismaMocks.campaignOperatorDeleteMany,
            createMany: prismaMocks.campaignOperatorCreateMany
          },
          opportunity: {
            findFirst: prismaMocks.opportunityFindFirst,
            create: prismaMocks.opportunityCreate,
            update: prismaMocks.opportunityUpdate,
            updateMany: prismaMocks.opportunityUpdateMany
          },
          form: {
            updateMany: prismaMocks.formUpdateMany
          },
          product: {
            updateMany: prismaMocks.productUpdateMany
          },
          customer: {
            findUnique: prismaMocks.customerFindUnique,
            findFirst: prismaMocks.customerFindFirst,
            findMany: prismaMocks.customerFindMany,
            update: prismaMocks.customerUpdate,
            updateMany: prismaMocks.customerUpdateMany
          },
          journey: {
            findUnique: prismaMocks.journeyFindUnique,
            delete: prismaMocks.journeyDelete,
            updateMany: prismaMocks.journeyUpdateMany
          },
          task: {
            deleteMany: prismaMocks.taskDeleteMany
          },
          recipientLog: {
            deleteMany: prismaMocks.recipientLogDeleteMany
          },
          automation: {
            deleteMany: prismaMocks.automationDeleteMany
          },
          flowExecution: {
            create: prismaMocks.flowExecutionCreate
          },
          pipeline: {
            findFirst: prismaMocks.pipelineFindFirst
          },
          flowVersion: {
            findFirst: prismaMocks.flowVersionFindFirst
          }
        });
      }
      return Promise.all(callbackOrArray);
    });
  });

  describe('1. Criação Desacoplada de Campanha (Draft sem audiência obrigatória)', () => {
    it('permite salvar rascunho de campanha com 0 leads associados', async () => {
      prismaMocks.campaignCreate.mockResolvedValue({ id: 'camp-123', name: 'Black Friday 2026', status: 'DRAFT' });
      prismaMocks.campaignFindUnique.mockResolvedValue({
        id: 'camp-123',
        name: 'Black Friday 2026',
        status: 'DRAFT',
        campaignNature: 'COMMERCIAL',
        pipelineId: 'pipe-vendas',
        operators: [{ user: { id: 'user-1', name: 'Mariana' } }]
      });

      const result = await CampaignOrchestrationService.saveDraft({
        name: 'Black Friday 2026',
        campaignNature: 'COMMERCIAL',
        pipelineId: 'pipe-vendas',
        operatorIds: ['user-1'],
        routingMode: 'ROUND_ROBIN'
      });

      expect(prismaMocks.campaignCreate).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          name: 'Black Friday 2026',
          status: 'DRAFT',
          campaignNature: 'COMMERCIAL',
          pipelineId: 'pipe-vendas'
        })
      }));
      expect(prismaMocks.campaignOperatorCreateMany).toHaveBeenCalledWith({
        data: [{ campaignId: 'camp-123', userId: 'user-1' }]
      });
      expect(result?.status).toBe('DRAFT');
    });
  });

  describe('2. Estágio e Adição de Audiência Tardia (Stage Audience)', () => {
    it('adiciona contatos como PLANNED na audiência da campanha', async () => {
      prismaMocks.campaignFindUnique.mockResolvedValue({ id: 'camp-123', status: 'DRAFT' });
      prismaMocks.customerFindUnique.mockResolvedValue({ id: 'cust-1' });

      const result = await CampaignOrchestrationService.stageAudience('camp-123', ['cust-1'], 'MANUAL');

      expect(prismaMocks.campaignAudienceMemberUpsert).toHaveBeenCalledWith(expect.objectContaining({
        where: { campaignId_customerId: { campaignId: 'camp-123', customerId: 'cust-1' } },
        create: expect.objectContaining({ status: 'PLANNED', sourceType: 'MANUAL' })
      }));
      expect(result.added).toBe(1);
    });
  });

  describe('3. Despoluição e Exclusão Segura (deleteCampaign)', () => {
    it('exclui campanha canônica desassociando opportunities e forms sem deletar Customers', async () => {
      prismaMocks.campaignFindUnique.mockResolvedValue({ id: 'camp-123', name: 'Campanha Antiga' });

      const result = await CampaignOrchestrationService.deleteCampaign('camp-123');

      expect(prismaMocks.opportunityUpdateMany).toHaveBeenCalledWith({
        where: { sourceCampaignId: 'camp-123' },
        data: { sourceCampaignId: null }
      });
      expect(prismaMocks.formUpdateMany).toHaveBeenCalledWith({
        where: { campaignId: 'camp-123' },
        data: { campaignId: null }
      });
      expect(prismaMocks.campaignAudienceMemberDeleteMany).toHaveBeenCalledWith({
        where: { campaignId: 'camp-123' }
      });
      expect(prismaMocks.campaignEnrollmentDeleteMany).toHaveBeenCalledWith({
        where: { campaignId: 'camp-123' }
      });
      expect(prismaMocks.campaignOperatorDeleteMany).toHaveBeenCalledWith({
        where: { campaignId: 'camp-123' }
      });
      expect(prismaMocks.campaignDelete).toHaveBeenCalledWith({
        where: { id: 'camp-123' }
      });
      // Verifica que NENHUM Customer foi deletado
      expect(result.success).toBe(true);
      expect(result.type).toBe('CAMPAIGN');
    });

    it('exclui jornada legada desassociando customers e forms com segurança', async () => {
      prismaMocks.campaignFindUnique.mockResolvedValue(null);
      prismaMocks.journeyFindUnique.mockResolvedValue({ id: 'journey-old', name: 'Jornada Legada' });

      const result = await CampaignOrchestrationService.deleteCampaign('journey-old');

      expect(prismaMocks.customerUpdateMany).toHaveBeenCalledWith({
        where: { journeyId: 'journey-old' },
        data: { journeyId: null, joinedJourneyAt: null }
      });
      expect(prismaMocks.formUpdateMany).toHaveBeenCalledWith({
        where: { journeyId: 'journey-old' },
        data: { journeyId: null }
      });
      expect(prismaMocks.journeyDelete).toHaveBeenCalledWith({
        where: { id: 'journey-old' }
      });
      expect(result.success).toBe(true);
      expect(result.type).toBe('JOURNEY');
    });
  });

  describe('4. Distribuição de Operadores em Campanhas Comerciais', () => {
    it('atribui ao operador do round-robin quando o lead está em novo_cadastro sem humanTakeover', async () => {
      prismaMocks.campaignFindUnique.mockResolvedValue({
        id: 'camp-1',
        name: 'Campanha Demo',
        campaignNature: 'COMMERCIAL',
        status: 'ACTIVE',
        routingMode: 'ROUND_ROBIN',
        pipelineId: 'pipe-vendas',
        initialStage: 'novo_cadastro',
        operators: [
          { userId: 'user-thais', user: { id: 'user-thais', isActive: true, skills: [] } },
          { userId: 'user-jucelia', user: { id: 'user-jucelia', isActive: true, skills: [] } }
        ],
        flowVersion: null
      });

      prismaMocks.campaignAudienceMemberFindMany.mockResolvedValue([{ customerId: 'cust-douglas' }]);
      prismaMocks.customerFindMany.mockResolvedValue([{
        id: 'cust-douglas',
        personId: 'person-douglas',
        assigneeId: 'admin-user', // Tinha Admin de teste anterior
        interactionCount: 5,       // Mensagens de teste anteriores
        humanTakeover: false,
        isInNurturing: false,
        person: { email: 'douglas@example.com', phoneNumber: '1199999999' }
      }]);

      prismaMocks.campaignEnrollmentGroupBy.mockResolvedValue([]);
      prismaMocks.campaignEnrollmentFindUnique.mockResolvedValue(null);
      prismaMocks.opportunityFindFirst.mockResolvedValue({
        id: 'opp-1',
        customerId: 'cust-douglas',
        pipelineId: 'pipe-vendas',
        stage: 'novo_cadastro',
        assigneeId: 'admin-user',
        humanTakeover: false,
        status: 'OPEN'
      });
      prismaMocks.opportunityUpdate.mockResolvedValue({ id: 'opp-1', assigneeId: 'user-thais' });
      prismaMocks.campaignEnrollmentUpsert.mockResolvedValue({ id: 'enr-1', assigneeId: 'user-thais' });

      const results = await CampaignOrchestrationService.enroll('camp-1', ['cust-douglas'], { activate: true });

      expect(results).toHaveLength(1);
      // O operador atribuído deve ser Thais ou Jucelia (do round-robin), NUNCA Admin!
      expect(prismaMocks.opportunityUpdate).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'opp-1' },
        data: expect.objectContaining({ assigneeId: 'user-thais' })
      }));
      expect(prismaMocks.customerUpdate).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'cust-douglas' },
        data: expect.objectContaining({ assigneeId: 'user-thais' })
      }));
    });

    it('preserva operador anterior se houver humanTakeover ativo', async () => {
      prismaMocks.campaignFindUnique.mockResolvedValue({
        id: 'camp-1',
        name: 'Campanha Demo',
        campaignNature: 'COMMERCIAL',
        status: 'ACTIVE',
        routingMode: 'ROUND_ROBIN',
        pipelineId: 'pipe-vendas',
        initialStage: 'novo_cadastro',
        operators: [
          { userId: 'user-thais', user: { id: 'user-thais', isActive: true, skills: [] } }
        ],
        flowVersion: null
      });

      prismaMocks.campaignAudienceMemberFindMany.mockResolvedValue([{ customerId: 'cust-2' }]);
      prismaMocks.customerFindMany.mockResolvedValue([{
        id: 'cust-2',
        personId: 'person-2',
        assigneeId: 'user-rogeria',
        interactionCount: 1,
        humanTakeover: true, // Vendedora Rogéria assumiu o chat
        isInNurturing: false,
        person: { email: 'lead@example.com', phoneNumber: '1198888888' }
      }]);

      prismaMocks.campaignEnrollmentGroupBy.mockResolvedValue([]);
      prismaMocks.campaignEnrollmentFindUnique.mockResolvedValue(null);
      prismaMocks.opportunityFindFirst.mockResolvedValue({
        id: 'opp-2',
        customerId: 'cust-2',
        pipelineId: 'pipe-vendas',
        stage: 'em_negociacao',
        assigneeId: 'user-rogeria',
        humanTakeover: true,
        status: 'OPEN'
      });
      prismaMocks.opportunityUpdate.mockResolvedValue({ id: 'opp-2', assigneeId: 'user-rogeria' });
      prismaMocks.campaignEnrollmentUpsert.mockResolvedValue({ id: 'enr-2', assigneeId: 'user-rogeria' });

      await CampaignOrchestrationService.enroll('camp-1', ['cust-2'], { activate: true });

      // Garante que Rogéria foi preservada porque estava em atendimento humano
      expect(prismaMocks.opportunityUpdate).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'opp-2' },
        data: expect.objectContaining({ assigneeId: 'user-rogeria' })
      }));
    });
  });
});

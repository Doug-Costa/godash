import prisma from '@/lib/prisma';
import type {
  IPostSaleRepository,
  PostSaleSequenceDTO,
  LeadPostSaleTaskDTO,
  CreateSequenceInput,
  CreateTaskInput,
  PostSaleTargetSegment,
  PostSaleTaskStatus,
} from '@/lib/domain/post-sale.types';

// ─────────────────────────────────────────────────────────────────────────────
// Mappers
// ─────────────────────────────────────────────────────────────────────────────

function mapSequence(a: {
  id: string;
  name: string;
  triggerEvent: string;
  conditions: any;
  actionType: string;
  actionConfig: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): PostSaleSequenceDTO {
  const config = a.actionConfig as any;
  const conditions = a.conditions as any;
  return {
    id: a.id,
    name: a.name,
    triggerDays: typeof config?.triggerDays === 'number' ? config.triggerDays : 0,
    templateMessage: config?.templateMessage || '',
    isActive: a.isActive,
    targetSegment: (conditions?.targetSegment || 'paid') as PostSaleTargetSegment,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

function mapTask(t: {
  id: string;
  customerId: string;
  assignedToId: string | null;
  scheduledFor: Date;
  status: string;
  completedAt: Date | null;
  completionNote: string | null;
  snapshotPlanId: number | null;
  snapshotPlanName: string | null;
  createdAt: Date;
  customer: { externalPersonId: number };
  automation: { id: string; name: string; actionConfig: any } | null;
  assignedTo: { name: string | null } | null;
}): LeadPostSaleTaskDTO {
  const config = t.automation?.actionConfig as any;
  return {
    id: t.id,
    externalPersonId: t.customer.externalPersonId,
    sequenceId: t.automation?.id || t.automation?.name || '', // Prefer ID, fallback to name
    sequenceName: t.automation?.name || 'Pós-Venda',
    templateMessage: config?.templateMessage || '',
    assignedToId: t.assignedToId,
    assignedToName: t.assignedTo?.name ?? null,
    status: t.status as PostSaleTaskStatus,
    scheduledFor: t.scheduledFor,
    completedAt: t.completedAt,
    completionNote: t.completionNote,
    snapshotPlanId: t.snapshotPlanId,
    snapshotPlanName: t.snapshotPlanName,
    createdAt: t.createdAt,
  };
}

const TASK_INCLUDE = {
  customer: { select: { externalPersonId: true } },
  automation: { select: { id: true, name: true, actionConfig: true } },
  assignedTo: { select: { name: true } },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Implementação
// ─────────────────────────────────────────────────────────────────────────────

export class PrismaPostSaleRepository implements IPostSaleRepository {
  // ── Sequências ─────────────────────────────────────────────────────────────

  async createSequence(data: CreateSequenceInput): Promise<PostSaleSequenceDTO> {
    const seq = await prisma.automation.create({
      data: {
        name: data.name,
        triggerEvent: 'POST_SALE',
        isActive: data.isActive ?? true,
        conditions: { targetSegment: data.targetSegment ?? 'paid' },
        actionType: 'CREATE_TASK',
        actionConfig: {
          triggerDays: data.triggerDays,
          templateMessage: data.templateMessage,
        },
      },
    });
    return mapSequence(seq);
  }

  async updateSequence(id: string, data: Partial<CreateSequenceInput>): Promise<PostSaleSequenceDTO> {
    const existing = await prisma.automation.findUnique({ where: { id } });
    if (!existing) throw new Error('Sequence not found');

    const currentConfig = (existing.actionConfig as any) || {};
    const currentConditions = (existing.conditions as any) || {};

    const seq = await prisma.automation.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        conditions: {
          targetSegment: data.targetSegment !== undefined ? data.targetSegment : (currentConditions.targetSegment ?? 'paid')
        },
        actionConfig: {
          triggerDays: data.triggerDays !== undefined ? data.triggerDays : (currentConfig.triggerDays ?? 0),
          templateMessage: data.templateMessage !== undefined ? data.templateMessage : (currentConfig.templateMessage ?? ''),
        }
      },
    });
    return mapSequence(seq);
  }

  async listSequences(onlyActive = false): Promise<PostSaleSequenceDTO[]> {
    const sequences = await prisma.automation.findMany({
      where: {
        triggerEvent: 'POST_SALE',
        ...(onlyActive ? { isActive: true } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });
    const mapped = sequences.map(mapSequence);
    return mapped.sort((a, b) => a.triggerDays - b.triggerDays);
  }

  async getSequenceById(id: string): Promise<PostSaleSequenceDTO | null> {
    const seq = await prisma.automation.findUnique({ where: { id } });
    return seq ? mapSequence(seq) : null;
  }

  // ── Tarefas ────────────────────────────────────────────────────────────────

  async createTask(data: CreateTaskInput): Promise<LeadPostSaleTaskDTO> {
    const seq = data.sequenceId ? await prisma.automation.findUnique({
      where: { id: data.sequenceId },
      select: { journeyId: true, channel: true, actionConfig: true }
    }) : null;
    const journeyId = seq?.journeyId || null;
    const channel = seq?.channel || (seq?.actionConfig as any)?.channel || 'POST_SALE';

    // Avoid duplicates by finding latest active customer with externalPersonId
    let customer = await prisma.customer.findFirst({
      where: { externalPersonId: data.externalPersonId },
      orderBy: { updatedAt: 'desc' }
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          externalPersonId: data.externalPersonId,
          journeyId,
          stage: 'novo_cadastro'
        }
      });
    }

    const task = await prisma.task.create({
      data: {
        customerId: customer.id,
        automationId: data.sequenceId,
        journeyId: journeyId,
        assignedToId: data.assignedToId ?? null,
        scheduledFor: data.scheduledFor,
        snapshotPlanId: data.snapshotPlanId ?? null,
        snapshotPlanName: data.snapshotPlanName ?? null,
        status: 'PENDING',
        taskType: channel
      },
      include: TASK_INCLUDE,
    });
    return mapTask(task as any);
  }

  async createManyTasks(data: CreateTaskInput[]): Promise<number> {
    if (data.length === 0) return 0;
    
    // 1. Fetch all needed automations in one query
    const sequenceIds = [...new Set(data.map(d => d.sequenceId).filter(Boolean))];
    const automations = await prisma.automation.findMany({
      where: { id: { in: sequenceIds } },
      select: { id: true, journeyId: true, channel: true, actionConfig: true }
    });
    const automationMap = new Map(automations.map(a => [a.id, a]));

    // 2. Fetch all existing customers and map them
    const externalPersonIds = [...new Set(data.map(d => d.externalPersonId))];
    const existingCustomers = await prisma.customer.findMany({
      where: { externalPersonId: { in: externalPersonIds } },
      orderBy: { updatedAt: 'desc' }
    });
    
    const customerMap = new Map<number, string>();
    for (const c of existingCustomers) {
      if (c.externalPersonId && !customerMap.has(c.externalPersonId)) {
        customerMap.set(c.externalPersonId, c.id);
      }
    }

    // 3. Create missing customers
    const missingPersonIds = externalPersonIds.filter(id => !customerMap.has(id));
    if (missingPersonIds.length > 0) {
      const missingCustomersData = missingPersonIds.map(missingId => {
        const row = data.find(d => d.externalPersonId === missingId);
        const seq = row?.sequenceId ? automationMap.get(row.sequenceId) : null;
        return {
          externalPersonId: missingId,
          journeyId: seq?.journeyId || null,
          stage: 'novo_cadastro'
        };
      });
      
      await prisma.customer.createMany({
        data: missingCustomersData,
        skipDuplicates: true
      });
      
      // Refetch the newly created customers to map their IDs
      const newCustomers = await prisma.customer.findMany({
        where: { externalPersonId: { in: missingPersonIds } }
      });
      for (const c of newCustomers) {
        if (c.externalPersonId) {
          customerMap.set(c.externalPersonId, c.id);
        }
      }
    }

    // 4. Prepare and create tasks
    const tasksToCreate = data.map(d => {
      const seq = d.sequenceId ? automationMap.get(d.sequenceId) : null;
      const journeyId = seq?.journeyId || null;
      const channel = seq?.channel || (seq?.actionConfig as any)?.channel || 'POST_SALE';
      const customerId = customerMap.get(d.externalPersonId);

      if (!customerId) {
        throw new Error(`Customer not found for externalPersonId: ${d.externalPersonId}`);
      }

      return {
        customerId,
        automationId: d.sequenceId,
        journeyId: journeyId,
        assignedToId: d.assignedToId ?? null,
        scheduledFor: d.scheduledFor,
        snapshotPlanId: d.snapshotPlanId ?? null,
        snapshotPlanName: d.snapshotPlanName ?? null,
        status: 'PENDING',
        taskType: channel
      };
    });

    const result = await prisma.task.createMany({
      data: tasksToCreate
    });

    return result.count;
  }

  async getTaskById(id: string): Promise<LeadPostSaleTaskDTO | null> {
    const task = await prisma.task.findUnique({
      where: { id },
      include: TASK_INCLUDE,
    });
    return task ? mapTask(task as any) : null;
  }

  async completeTask(id: string, note?: string): Promise<LeadPostSaleTaskDTO> {
    const task = await prisma.task.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        completionNote: note ?? null,
      },
      include: TASK_INCLUDE,
    });
    return mapTask(task as any);
  }

  async cancelTask(id: string): Promise<LeadPostSaleTaskDTO> {
    const task = await prisma.task.update({
      where: { id },
      data: { status: 'CANCELED' },
      include: TASK_INCLUDE,
    });
    return mapTask(task as any);
  }

  // ── Alertas ────────────────────────────────────────────────────────────────

  async getPendingAlerts(assignedToId?: string): Promise<LeadPostSaleTaskDTO[]> {
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { taskType: 'POST_SALE' },
          { automation: { triggerEvent: 'POST_SALE' } }
        ],
        status: 'PENDING',
        scheduledFor: { lte: new Date() },
        ...(assignedToId ? { assignedToId } : {}),
      },
      include: TASK_INCLUDE,
      orderBy: { scheduledFor: 'asc' },
    });
    return tasks.map(t => mapTask(t as any));
  }

  // ── Verificação de duplicidade ─────────────────────────────────────────────

  async taskExistsForPersonAndSequence(
    externalPersonId: number,
    sequenceId: string
  ): Promise<boolean> {
    const count = await prisma.task.count({
      where: {
        OR: [
          { taskType: 'POST_SALE' },
          { automation: { triggerEvent: 'POST_SALE' } }
        ],
        customer: { externalPersonId },
        automationId: sequenceId,
        status: 'PENDING',
      },
    });
    return count > 0;
  }
}

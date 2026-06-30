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

function mapSequence(s: {
  id: string;
  name: string;
  triggerDays: number;
  templateMessage: string;
  isActive: boolean;
  targetSegment: string;
  createdAt: Date;
  updatedAt: Date;
}): PostSaleSequenceDTO {
  return {
    id: s.id,
    name: s.name,
    triggerDays: s.triggerDays,
    templateMessage: s.templateMessage,
    isActive: s.isActive,
    targetSegment: s.targetSegment as PostSaleTargetSegment,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

function mapTask(t: {
  id: string;
  externalPersonId: number;
  sequenceId: string;
  assignedToId: string | null;
  status: string;
  scheduledFor: Date;
  completedAt: Date | null;
  completionNote: string | null;
  snapshotPlanId: number | null;
  snapshotPlanName: string | null;
  createdAt: Date;
  updatedAt: Date;
  sequence: { name: string; templateMessage: string };
  assignedTo: { name: string | null } | null;
}): LeadPostSaleTaskDTO {
  return {
    id: t.id,
    externalPersonId: t.externalPersonId,
    sequenceId: t.sequenceId,
    sequenceName: t.sequence.name,
    templateMessage: t.sequence.templateMessage,
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
  sequence: { select: { name: true, templateMessage: true } },
  assignedTo: { select: { name: true } },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Implementação
// ─────────────────────────────────────────────────────────────────────────────

export class PrismaPostSaleRepository implements IPostSaleRepository {
  // ── Sequências ─────────────────────────────────────────────────────────────

  async createSequence(data: CreateSequenceInput): Promise<PostSaleSequenceDTO> {
    const seq = await prisma.postSaleSequence.create({
      data: {
        name: data.name,
        triggerDays: data.triggerDays,
        templateMessage: data.templateMessage,
        isActive: data.isActive ?? true,
        targetSegment: data.targetSegment ?? 'paid',
      },
    });
    return mapSequence(seq);
  }

  async updateSequence(id: string, data: Partial<CreateSequenceInput>): Promise<PostSaleSequenceDTO> {
    const seq = await prisma.postSaleSequence.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.triggerDays !== undefined && { triggerDays: data.triggerDays }),
        ...(data.templateMessage !== undefined && { templateMessage: data.templateMessage }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.targetSegment !== undefined && { targetSegment: data.targetSegment }),
      },
    });
    return mapSequence(seq);
  }

  async listSequences(onlyActive = false): Promise<PostSaleSequenceDTO[]> {
    const sequences = await prisma.postSaleSequence.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: { triggerDays: 'asc' },
    });
    return sequences.map(mapSequence);
  }

  async getSequenceById(id: string): Promise<PostSaleSequenceDTO | null> {
    const seq = await prisma.postSaleSequence.findUnique({ where: { id } });
    return seq ? mapSequence(seq) : null;
  }

  // ── Tarefas ────────────────────────────────────────────────────────────────

  async createTask(data: CreateTaskInput): Promise<LeadPostSaleTaskDTO> {
    const task = await prisma.leadPostSaleTask.create({
      data: {
        externalPersonId: data.externalPersonId,
        sequenceId: data.sequenceId,
        assignedToId: data.assignedToId ?? null,
        scheduledFor: data.scheduledFor,
        snapshotPlanId: data.snapshotPlanId ?? null,
        snapshotPlanName: data.snapshotPlanName ?? null,
        status: 'PENDING',
      },
      include: TASK_INCLUDE,
    });
    return mapTask(task);
  }

  async createManyTasks(data: CreateTaskInput[]): Promise<number> {
    if (data.length === 0) return 0;
    const result = await prisma.leadPostSaleTask.createMany({
      data: data.map(d => ({
        externalPersonId: d.externalPersonId,
        sequenceId: d.sequenceId,
        assignedToId: d.assignedToId ?? null,
        scheduledFor: d.scheduledFor,
        snapshotPlanId: d.snapshotPlanId ?? null,
        snapshotPlanName: d.snapshotPlanName ?? null,
        status: 'PENDING',
      })),
      // skipDuplicates: SQLite não suporta — deduplicação feita manualmente antes
    });
    return result.count;
  }

  async getTaskById(id: string): Promise<LeadPostSaleTaskDTO | null> {
    const task = await prisma.leadPostSaleTask.findUnique({
      where: { id },
      include: TASK_INCLUDE,
    });
    return task ? mapTask(task) : null;
  }

  async completeTask(id: string, note?: string): Promise<LeadPostSaleTaskDTO> {
    const task = await prisma.leadPostSaleTask.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        completionNote: note ?? null,
      },
      include: TASK_INCLUDE,
    });
    return mapTask(task);
  }

  async cancelTask(id: string): Promise<LeadPostSaleTaskDTO> {
    const task = await prisma.leadPostSaleTask.update({
      where: { id },
      data: { status: 'CANCELED' },
      include: TASK_INCLUDE,
    });
    return mapTask(task);
  }

  // ── Alertas ────────────────────────────────────────────────────────────────

  async getPendingAlerts(assignedToId?: string): Promise<LeadPostSaleTaskDTO[]> {
    const tasks = await prisma.leadPostSaleTask.findMany({
      where: {
        status: 'PENDING',
        scheduledFor: { lte: new Date() },
        ...(assignedToId ? { assignedToId } : {}),
      },
      include: TASK_INCLUDE,
      orderBy: { scheduledFor: 'asc' },
    });
    return tasks.map(mapTask);
  }

  // ── Verificação de duplicidade ─────────────────────────────────────────────

  async taskExistsForPersonAndSequence(
    externalPersonId: number,
    sequenceId: string
  ): Promise<boolean> {
    const count = await prisma.leadPostSaleTask.count({
      where: {
        externalPersonId,
        sequenceId,
        status: 'PENDING',
      },
    });
    return count > 0;
  }
}

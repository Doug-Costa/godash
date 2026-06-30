// ─────────────────────────────────────────────────────────────────────────────
// DentalGO — Tipos de Domínio: Pós-Venda (Épico 7)
// ─────────────────────────────────────────────────────────────────────────────

/** Roles disponíveis no sistema */
export type UserRole = 'ADMIN' | 'AGENT' | 'POST_SALES';

/** Status possíveis de uma LeadPostSaleTask */
export type PostSaleTaskStatus = 'PENDING' | 'COMPLETED' | 'CANCELED' | 'SKIPPED';

/** Segmentos de clientes alvo de uma sequência */
export type PostSaleTargetSegment = 'all' | 'paid' | 'book_only' | 'promo' | 'courtesy';

// ─────────────────────────────────────────────────────────────────────────────
// Entidades de Domínio
// ─────────────────────────────────────────────────────────────────────────────

export interface PostSaleSequenceDTO {
  id: string;
  name: string;
  triggerDays: number;
  templateMessage: string;
  isActive: boolean;
  targetSegment: PostSaleTargetSegment;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadPostSaleTaskDTO {
  id: string;
  externalPersonId: number;
  sequenceId: string;
  sequenceName: string;
  templateMessage: string;
  assignedToId: string | null;
  assignedToName: string | null;
  status: PostSaleTaskStatus;
  scheduledFor: Date;
  completedAt: Date | null;
  completionNote: string | null;
  snapshotPlanId: number | null;
  snapshotPlanName: string | null;
  createdAt: Date;
}

/** Alerta enriquecido: task + dados do lead do Banco 1 */
export interface PostSaleAlertDTO extends LeadPostSaleTaskDTO {
  personFullName?: string;
  personEmail?: string;
  personPhone?: string;
  /** Mensagem com variáveis substituídas */
  renderedMessage?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Contratos de Repositório
// ─────────────────────────────────────────────────────────────────────────────

export interface IPostSaleRepository {
  // Sequências
  createSequence(data: CreateSequenceInput): Promise<PostSaleSequenceDTO>;
  updateSequence(id: string, data: Partial<CreateSequenceInput>): Promise<PostSaleSequenceDTO>;
  listSequences(onlyActive?: boolean): Promise<PostSaleSequenceDTO[]>;
  getSequenceById(id: string): Promise<PostSaleSequenceDTO | null>;

  // Tarefas
  createTask(data: CreateTaskInput): Promise<LeadPostSaleTaskDTO>;
  createManyTasks(data: CreateTaskInput[]): Promise<number>;
  getTaskById(id: string): Promise<LeadPostSaleTaskDTO | null>;
  completeTask(id: string, note?: string): Promise<LeadPostSaleTaskDTO>;
  cancelTask(id: string): Promise<LeadPostSaleTaskDTO>;

  // Alertas — tarefas PENDING com scheduledFor <= agora
  getPendingAlerts(assignedToId?: string): Promise<LeadPostSaleTaskDTO[]>;

  // Verificação de duplicidade (evitar criar task se já existe para mesma pessoa+sequência pendente)
  taskExistsForPersonAndSequence(externalPersonId: number, sequenceId: string): Promise<boolean>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inputs
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateSequenceInput {
  name: string;
  triggerDays: number;
  templateMessage: string;
  isActive?: boolean;
  targetSegment?: PostSaleTargetSegment;
}

export interface CreateTaskInput {
  externalPersonId: number;
  sequenceId: string;
  assignedToId?: string;
  scheduledFor: Date;
  snapshotPlanId?: number;
  snapshotPlanName?: string;
}

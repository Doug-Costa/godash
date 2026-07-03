import prisma from '@/lib/prisma';
import { ICrmRepository, CrmLeadState, CrmLeadInteraction, LossReason, LeadTag } from '@/lib/domain/crm.types';

export class PrismaCrmRepository implements ICrmRepository {
  async getLeadState(externalPersonId: number): Promise<CrmLeadState | null> {
    const state = await prisma.leadState.findUnique({
      where: { externalPersonId },
    });

    if (!state) return null;

    return {
      externalPersonId: state.externalPersonId,
      stage: state.stage,
      assigneeId: state.assigneeId,
      lastInteractionAt: state.lastInteractionAt,
      interactionCount: state.interactionCount,
      lossReason: state.lossReason,
      tag: state.tag,
    };
  }

  async getManyLeadStates(externalPersonIds: number[]): Promise<CrmLeadState[]> {
    const states = await prisma.leadState.findMany({
      where: {
        externalPersonId: {
          in: externalPersonIds,
        },
      },
    });

    return states.map((s) => ({
      externalPersonId: s.externalPersonId,
      stage: s.stage,
      assigneeId: s.assigneeId,
      lastInteractionAt: s.lastInteractionAt,
      interactionCount: s.interactionCount,
      lossReason: s.lossReason,
      tag: s.tag,
    }));
  }

  async updateStage(externalPersonId: number, newStage: string): Promise<CrmLeadState> {
    const state = await prisma.leadState.upsert({
      where: { externalPersonId },
      update: { stage: newStage },
      create: { externalPersonId, stage: newStage },
    });

    return {
      externalPersonId: state.externalPersonId,
      stage: state.stage,
      assigneeId: state.assigneeId,
      lastInteractionAt: state.lastInteractionAt,
      interactionCount: state.interactionCount,
      lossReason: state.lossReason,
      tag: state.tag,
    };
  }

  async assignLead(externalPersonId: number, assigneeId: string | null): Promise<CrmLeadState> {
    const state = await prisma.leadState.upsert({
      where: { externalPersonId },
      update: { assigneeId },
      create: { externalPersonId, stage: 'novo_cadastro', assigneeId },
    });

    return {
      externalPersonId: state.externalPersonId,
      stage: state.stage,
      assigneeId: state.assigneeId,
      lastInteractionAt: state.lastInteractionAt,
      interactionCount: state.interactionCount,
      lossReason: state.lossReason,
      tag: state.tag,
    };
  }

  async addInteraction(externalPersonId: number, text: string, authorId: string): Promise<CrmLeadInteraction> {
    const leadState = await prisma.leadState.upsert({
      where: { externalPersonId },
      update: {
        lastInteractionAt: new Date(),
        interactionCount: {
          increment: 1
        }
      },
      create: { 
        externalPersonId, 
        stage: 'novo_cadastro',
        lastInteractionAt: new Date(),
        interactionCount: 1
      },
    });

    const interaction = await prisma.leadInteraction.create({
      data: {
        leadStateId: leadState.id,
        text,
        authorId,
      },
      include: {
        leadState: {
          select: {
            externalPersonId: true,
          },
        },
      },
    });

    return {
      id: interaction.id,
      leadStateExternalId: interaction.leadState.externalPersonId,
      text: interaction.text,
      authorId: interaction.authorId,
      createdAt: interaction.createdAt,
    };
  }

  async getInteractions(externalPersonId: number): Promise<CrmLeadInteraction[]> {
    const interactions = await prisma.leadInteraction.findMany({
      where: {
        leadState: {
          externalPersonId,
        },
      },
      include: {
        leadState: {
          select: {
            externalPersonId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return interactions.map((i) => ({
      id: i.id,
      leadStateExternalId: i.leadState.externalPersonId,
      text: i.text,
      authorId: i.authorId,
      createdAt: i.createdAt,
    }));
  }

  async updateLeadState(externalPersonId: number, data: Partial<CrmLeadState>): Promise<CrmLeadState> {
    const state = await prisma.leadState.upsert({
      where: { externalPersonId },
      update: {
        stage: data.stage,
        assigneeId: data.assigneeId,
        lastInteractionAt: data.lastInteractionAt,
        interactionCount: data.interactionCount,
        lossReason: data.lossReason,
        tag: data.tag,
      },
      create: {
        externalPersonId,
        stage: data.stage || 'novo_cadastro',
        assigneeId: data.assigneeId,
        lastInteractionAt: data.lastInteractionAt || new Date(),
        interactionCount: data.interactionCount || 0,
        lossReason: data.lossReason,
        tag: data.tag,
      },
    });

    return {
      externalPersonId: state.externalPersonId,
      stage: state.stage,
      assigneeId: state.assigneeId,
      lastInteractionAt: state.lastInteractionAt,
      interactionCount: state.interactionCount,
      lossReason: state.lossReason,
      tag: state.tag,
    };
  }

  async getLeadsByLossReason(reason: LossReason): Promise<CrmLeadState[]> {
    const states = await prisma.leadState.findMany({
      where: { lossReason: reason },
    });

    return states.map((s) => ({
      externalPersonId: s.externalPersonId,
      stage: s.stage,
      assigneeId: s.assigneeId,
      lastInteractionAt: s.lastInteractionAt,
      interactionCount: s.interactionCount,
      lossReason: s.lossReason,
      tag: s.tag,
    }));
  }

  async getLeadsByTag(tag: LeadTag): Promise<CrmLeadState[]> {
    const states = await prisma.leadState.findMany({
      where: { tag },
    });

    return states.map((s) => ({
      externalPersonId: s.externalPersonId,
      stage: s.stage,
      assigneeId: s.assigneeId,
      lastInteractionAt: s.lastInteractionAt,
      interactionCount: s.interactionCount,
      lossReason: s.lossReason,
      tag: s.tag,
    }));
  }

  async getExpiredSlaLeads(days: number): Promise<CrmLeadState[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - days);

    const states = await prisma.leadState.findMany({
      where: {
        stage: {
          in: ['primeiro_contato', 'em_negociacao']
        },
        assigneeId: {
          not: null
        },
        OR: [
          { lastInteractionAt: { lte: thresholdDate } },
          { lastInteractionAt: null }
        ]
      },
    });

    return states.map((s) => ({
      externalPersonId: s.externalPersonId,
      stage: s.stage,
      assigneeId: s.assigneeId,
      lastInteractionAt: s.lastInteractionAt,
      interactionCount: s.interactionCount,
      lossReason: s.lossReason,
      tag: s.tag,
    }));
  }
}

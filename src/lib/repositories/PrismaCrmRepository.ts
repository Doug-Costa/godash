import prisma from '@/lib/prisma';
import { ICrmRepository, CrmLeadState, CrmLeadInteraction } from '@/lib/domain/crm.types';

export class PrismaCrmRepository implements ICrmRepository {
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
    };
  }

  async assignLead(externalPersonId: number, assigneeId: string): Promise<CrmLeadState> {
    const state = await prisma.leadState.upsert({
      where: { externalPersonId },
      update: { assigneeId },
      create: { externalPersonId, stage: 'novo_cadastro', assigneeId },
    });

    return {
      externalPersonId: state.externalPersonId,
      stage: state.stage,
      assigneeId: state.assigneeId,
    };
  }

  async addInteraction(externalPersonId: number, text: string, authorId: string): Promise<CrmLeadInteraction> {
    const leadState = await prisma.leadState.upsert({
      where: { externalPersonId },
      update: {},
      create: { externalPersonId, stage: 'novo_cadastro' },
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
}

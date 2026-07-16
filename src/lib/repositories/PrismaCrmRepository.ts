import prisma from '@/lib/prisma';
import { ICrmRepository, CrmCustomer, CrmInteraction, LossReason, LeadTag } from '@/lib/domain/crm.types';

export class PrismaCrmRepository implements ICrmRepository {
  private async findOrCreateCustomer(externalPersonId: number, journeyId: string | null = null): Promise<any> {
    const existing = await prisma.customer.findFirst({
      where: {
        externalPersonId,
        journeyId: journeyId || null
      }
    });

    if (existing) return existing;

    return prisma.customer.create({
      data: {
        externalPersonId,
        journeyId: journeyId || null,
        stage: 'novo_cadastro'
      }
    });
  }

  async getCustomer(externalPersonId: number, journeyId?: string | null): Promise<CrmCustomer | null> {
    const customer = await prisma.customer.findFirst({
      where: { 
        externalPersonId,
        journeyId: journeyId !== undefined ? (journeyId || null) : undefined
      },
    });

    if (!customer) return null;

    return {
      id: customer.id,
      externalPersonId: customer.externalPersonId,
      stage: customer.stage,
      assigneeId: customer.assigneeId,
      pipelineId: customer.pipelineId,
      journeyId: customer.journeyId,
      joinedJourneyAt: customer.joinedJourneyAt,
      metadata: customer.metadata,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      lastInteractionAt: customer.lastInteractionAt,
      interactionCount: customer.interactionCount,
      lossReason: customer.lossReason,
      tag: customer.tag,
      scheduledFor: customer.scheduledFor,
      frozenUntil: customer.frozenUntil,
      freezeReason: customer.freezeReason,
      lostReason: customer.lostReason,
    };
  }

  async getManyCustomers(externalPersonIds: number[]): Promise<CrmCustomer[]> {
    const customers = await prisma.customer.findMany({
      where: {
        externalPersonId: {
          in: externalPersonIds,
        },
      },
    });

    return customers.map((c) => ({
      id: c.id,
      externalPersonId: c.externalPersonId,
      stage: c.stage,
      assigneeId: c.assigneeId,
      pipelineId: c.pipelineId,
      journeyId: c.journeyId,
      joinedJourneyAt: c.joinedJourneyAt,
      metadata: c.metadata,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      lastInteractionAt: c.lastInteractionAt,
      interactionCount: c.interactionCount,
      lossReason: c.lossReason,
      tag: c.tag,
      scheduledFor: c.scheduledFor,
      frozenUntil: c.frozenUntil,
      freezeReason: c.freezeReason,
      lostReason: c.lostReason,
    }));
  }

  async updateStage(externalPersonId: number, newStage: string, journeyId?: string | null): Promise<CrmCustomer> {
    const customer = await this.findOrCreateCustomer(externalPersonId, journeyId);
    
    const updated = await prisma.customer.update({
      where: { id: customer.id },
      data: { stage: newStage }
    });

    return {
      id: updated.id,
      externalPersonId: updated.externalPersonId,
      stage: updated.stage,
      assigneeId: updated.assigneeId,
      pipelineId: updated.pipelineId,
      journeyId: updated.journeyId,
      joinedJourneyAt: updated.joinedJourneyAt,
      metadata: updated.metadata,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      lastInteractionAt: updated.lastInteractionAt,
      interactionCount: updated.interactionCount,
      lossReason: updated.lossReason,
      tag: updated.tag,
      scheduledFor: updated.scheduledFor,
      frozenUntil: updated.frozenUntil,
      freezeReason: updated.freezeReason,
      lostReason: updated.lostReason,
    };
  }

  async assignLead(externalPersonId: number, assigneeId: string | null, journeyId?: string | null): Promise<CrmCustomer> {
    const customer = await this.findOrCreateCustomer(externalPersonId, journeyId);

    const updated = await prisma.customer.update({
      where: { id: customer.id },
      data: { assigneeId }
    });

    return {
      id: updated.id,
      externalPersonId: updated.externalPersonId,
      stage: updated.stage,
      assigneeId: updated.assigneeId,
      pipelineId: updated.pipelineId,
      journeyId: updated.journeyId,
      joinedJourneyAt: updated.joinedJourneyAt,
      metadata: updated.metadata,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      lastInteractionAt: updated.lastInteractionAt,
      interactionCount: updated.interactionCount,
      lossReason: updated.lossReason,
      tag: updated.tag,
      scheduledFor: updated.scheduledFor,
      frozenUntil: updated.frozenUntil,
      freezeReason: updated.freezeReason,
      lostReason: updated.lostReason,
    };
  }

  async addInteraction(externalPersonId: number, text: string, authorId: string | null, journeyId?: string | null): Promise<CrmInteraction> {
    const customer = await this.findOrCreateCustomer(externalPersonId, journeyId);

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        lastInteractionAt: new Date(),
        interactionCount: {
          increment: 1
        }
      }
    });

    const interaction = await prisma.interaction.create({
      data: {
        customerId: customer.id,
        text,
        authorId,
      },
    });

    return {
      id: interaction.id,
      customerId: interaction.customerId,
      text: interaction.text,
      authorId: interaction.authorId,
      createdAt: interaction.createdAt,
    };
  }

  async getInteractions(externalPersonId: number, journeyId?: string | null): Promise<CrmInteraction[]> {
    const interactions = await prisma.interaction.findMany({
      where: {
        customer: {
          externalPersonId,
          journeyId: journeyId !== undefined ? (journeyId || null) : undefined,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return interactions.map((i) => ({
      id: i.id,
      customerId: i.customerId,
      text: i.text,
      authorId: i.authorId,
      createdAt: i.createdAt,
    }));
  }

  async updateCustomer(externalPersonId: number, data: Partial<CrmCustomer>, journeyId?: string | null): Promise<CrmCustomer> {
    const customer = await this.findOrCreateCustomer(externalPersonId, journeyId);

    const updated = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        stage: data.stage,
        assigneeId: data.assigneeId,
        pipelineId: data.pipelineId,
        journeyId: data.journeyId !== undefined ? data.journeyId : undefined,
        joinedJourneyAt: data.joinedJourneyAt,
        metadata: data.metadata,
        lastInteractionAt: data.lastInteractionAt,
        interactionCount: data.interactionCount,
        lossReason: data.lossReason,
        tag: data.tag,
        scheduledFor: data.scheduledFor,
        frozenUntil: data.frozenUntil,
        freezeReason: data.freezeReason,
        lostReason: data.lostReason,
      },
    });

    return {
      id: updated.id,
      externalPersonId: updated.externalPersonId,
      stage: updated.stage,
      assigneeId: updated.assigneeId,
      pipelineId: updated.pipelineId,
      journeyId: updated.journeyId,
      joinedJourneyAt: updated.joinedJourneyAt,
      metadata: updated.metadata,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      lastInteractionAt: updated.lastInteractionAt,
      interactionCount: updated.interactionCount,
      lossReason: updated.lossReason,
      tag: updated.tag,
      scheduledFor: updated.scheduledFor,
      frozenUntil: updated.frozenUntil,
      freezeReason: updated.freezeReason,
      lostReason: updated.lostReason,
    };
  }

  async getCustomersByLossReason(reason: LossReason): Promise<CrmCustomer[]> {
    const customers = await prisma.customer.findMany({
      where: { lossReason: reason },
    });

    return customers.map((c) => ({
      id: c.id,
      externalPersonId: c.externalPersonId,
      stage: c.stage,
      assigneeId: c.assigneeId,
      pipelineId: c.pipelineId,
      journeyId: c.journeyId,
      joinedJourneyAt: c.joinedJourneyAt,
      metadata: c.metadata,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      lastInteractionAt: c.lastInteractionAt,
      interactionCount: c.interactionCount,
      lossReason: c.lossReason,
      tag: c.tag,
      scheduledFor: c.scheduledFor,
      frozenUntil: c.frozenUntil,
      freezeReason: c.freezeReason,
      lostReason: c.lostReason,
    }));
  }

  async getCustomersByTag(tag: LeadTag): Promise<CrmCustomer[]> {
    const customers = await prisma.customer.findMany({
      where: { tag },
    });

    return customers.map((c) => ({
      id: c.id,
      externalPersonId: c.externalPersonId,
      stage: c.stage,
      assigneeId: c.assigneeId,
      pipelineId: c.pipelineId,
      journeyId: c.journeyId,
      joinedJourneyAt: c.joinedJourneyAt,
      metadata: c.metadata,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      lastInteractionAt: c.lastInteractionAt,
      interactionCount: c.interactionCount,
      lossReason: c.lossReason,
      tag: c.tag,
      scheduledFor: c.scheduledFor,
      frozenUntil: c.frozenUntil,
      freezeReason: c.freezeReason,
      lostReason: c.lostReason,
    }));
  }

  async getExpiredSlaCustomers(days: number): Promise<CrmCustomer[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - days);

    const customers = await prisma.customer.findMany({
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

    return customers.map((c) => ({
      id: c.id,
      externalPersonId: c.externalPersonId,
      stage: c.stage,
      assigneeId: c.assigneeId,
      pipelineId: c.pipelineId,
      journeyId: c.journeyId,
      joinedJourneyAt: c.joinedJourneyAt,
      metadata: c.metadata,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      lastInteractionAt: c.lastInteractionAt,
      interactionCount: c.interactionCount,
      lossReason: c.lossReason,
      tag: c.tag,
      scheduledFor: c.scheduledFor,
      frozenUntil: c.frozenUntil,
      freezeReason: c.freezeReason,
      lostReason: c.lostReason,
    }));
  }
}

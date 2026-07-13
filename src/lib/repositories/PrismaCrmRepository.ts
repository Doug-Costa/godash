import prisma from '@/lib/prisma';
import { ICrmRepository, CrmCustomer, CrmInteraction, LossReason, LeadTag } from '@/lib/domain/crm.types';

export class PrismaCrmRepository implements ICrmRepository {
  async getCustomer(externalPersonId: number): Promise<CrmCustomer | null> {
    const customer = await prisma.customer.findUnique({
      where: { externalPersonId },
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

  async updateStage(externalPersonId: number, newStage: string): Promise<CrmCustomer> {
    const customer = await prisma.customer.upsert({
      where: { externalPersonId },
      update: { stage: newStage },
      create: { externalPersonId, stage: newStage },
    });

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

  async assignLead(externalPersonId: number, assigneeId: string | null): Promise<CrmCustomer> {
    const customer = await prisma.customer.upsert({
      where: { externalPersonId },
      update: { assigneeId },
      create: { externalPersonId, stage: 'novo_cadastro', assigneeId },
    });

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

  async addInteraction(externalPersonId: number, text: string, authorId: string): Promise<CrmInteraction> {
    const customer = await prisma.customer.upsert({
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

  async getInteractions(externalPersonId: number): Promise<CrmInteraction[]> {
    const interactions = await prisma.interaction.findMany({
      where: {
        customer: {
          externalPersonId,
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

  async updateCustomer(externalPersonId: number, data: Partial<CrmCustomer>): Promise<CrmCustomer> {
    const customer = await prisma.customer.upsert({
      where: { externalPersonId },
      update: {
        stage: data.stage,
        assigneeId: data.assigneeId,
        pipelineId: data.pipelineId,
        journeyId: data.journeyId,
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
      create: {
        externalPersonId,
        stage: data.stage || 'novo_cadastro',
        assigneeId: data.assigneeId,
        pipelineId: data.pipelineId,
        journeyId: data.journeyId,
        joinedJourneyAt: data.joinedJourneyAt,
        metadata: data.metadata || {},
        lastInteractionAt: data.lastInteractionAt || new Date(),
        interactionCount: data.interactionCount || 0,
        lossReason: data.lossReason,
        tag: data.tag,
        scheduledFor: data.scheduledFor,
        frozenUntil: data.frozenUntil,
        freezeReason: data.freezeReason,
        lostReason: data.lostReason,
      },
    });

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

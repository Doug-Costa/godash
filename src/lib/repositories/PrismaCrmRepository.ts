import prisma from '@/lib/prisma';
import { DomainEventService } from '@/lib/services/DomainEventService';
import { DomainEventType, ActorType } from '@/lib/domain/events';
import { ICrmRepository, CrmCustomer, CrmInteraction, LossReason, LeadTag } from '@/lib/domain/crm.types';
import { CustomerRevenueService } from '@/lib/application/CustomerRevenueService';
import { CanonicalIdentityService } from '@/lib/services/CanonicalIdentityService';

export class PrismaCrmRepository implements ICrmRepository {
  private async findOrCreateCustomer(idOrExtId: string | number | null, journeyId: string | null = null): Promise<any> {
    if (idOrExtId === null) throw new Error('Identifier cannot be null');

    if (typeof idOrExtId === 'string') {
      const existing = await prisma.customer.findUnique({
        where: { id: idOrExtId }
      });
      if (!existing) throw new Error(`Customer with CUID ${idOrExtId} not found`);
      return existing;
    }

    const existing = await prisma.customer.findFirst({
      where: {
        externalPersonId: idOrExtId,
        journeyId: journeyId || null
      }
    });

    if (existing) return existing;

    const defaultPipeline = await prisma.pipeline.findFirst({
      where: { name: 'Vendas' }
    }) || await prisma.pipeline.findFirst();

    // CDP V4 - Identidade Canônica
    const person = await CanonicalIdentityService.resolve({
      source: 'DENTALGO',
      externalId: String(idOrExtId)
    });

    return prisma.customer.create({
      data: {
        externalPersonId: idOrExtId,
        personId: person.id,
        journeyId: journeyId || null,
        stage: 'novo_cadastro',
        pipelineId: defaultPipeline?.id || null
      }
    });
  }

  async getCustomer(idOrExtId: string | number | null, journeyId?: string | null): Promise<CrmCustomer | null> {
    if (idOrExtId === null) return null;

    const customer = typeof idOrExtId === 'string'
      ? await prisma.customer.findUnique({ where: { id: idOrExtId } })
      : await prisma.customer.findFirst({
          where: { 
            externalPersonId: idOrExtId,
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
      humanTakeover: customer.humanTakeover,
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

  async updateStage(idOrExtId: string | number | null, newStage: string, journeyId?: string | null): Promise<CrmCustomer> {
    const customer = await this.findOrCreateCustomer(idOrExtId, journeyId);
    
    const defaultPipeline = !customer.pipelineId 
      ? (await prisma.pipeline.findFirst({ where: { name: 'Vendas' } }) || await prisma.pipeline.findFirst())
      : null;

    const updated = await prisma.customer.update({
      where: { id: customer.id },
      data: { 
        stage: newStage,
        ...(defaultPipeline && { pipelineId: defaultPipeline.id })
      }
    });

    const targetPipelineId = defaultPipeline?.id || customer.pipelineId;
    if (targetPipelineId) {
      const oppStatus = newStage === 'ganho' ? 'WON' : newStage === 'perdido' ? 'LOST' : undefined;
      await prisma.opportunity.updateMany({
        where: { customerId: customer.id, pipelineId: targetPipelineId },
        data: { 
          stage: newStage,
          lastSignificantActivityAt: new Date(),
          ...(oppStatus && { status: oppStatus })
        }
      });

      if (newStage === 'ganho') {
        try {
          await CustomerRevenueService.recalculateLTV(customer.id);
        } catch (err) {
          console.error('[PrismaCrmRepository] Error recalculating LTV on stage move:', err);
        }
      }

      // Dispara Domain Event
      DomainEventService.publish({
        type: DomainEventType.OPPORTUNITY_STAGE_CHANGED,
        personId: customer.personId,
        customerId: customer.id,
        actorType: ActorType.SYSTEM,
        metadata: {
          fromStage: customer.stage,
          toStage: newStage,
          pipelineId: targetPipelineId
        }
      });
    }

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

  async assignLead(idOrExtId: string | number | null, assigneeId: string | null, journeyId?: string | null): Promise<CrmCustomer> {
    const customer = await this.findOrCreateCustomer(idOrExtId, journeyId);

    const defaultPipeline = !customer.pipelineId 
      ? (await prisma.pipeline.findFirst({ where: { name: 'Vendas' } }) || await prisma.pipeline.findFirst())
      : null;

    const updated = await prisma.customer.update({
      where: { id: customer.id },
      data: { 
        assigneeId,
        ...(defaultPipeline && { pipelineId: defaultPipeline.id })
      }
    });

    const targetPipelineId = defaultPipeline?.id || customer.pipelineId;
    if (targetPipelineId) {
      await prisma.opportunity.updateMany({
        where: { customerId: customer.id, pipelineId: targetPipelineId },
        data: { assigneeId }
      });
    }

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

  async addInteraction(idOrExtId: string | number | null, text: string, authorId: string | null, journeyId?: string | null, type?: string): Promise<CrmInteraction> {
    const customer = await this.findOrCreateCustomer(idOrExtId, journeyId);

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
        type: type || undefined,
      },
    });

    const SIGNIFICANT_TYPES = ['CONTACT_ATTEMPT', 'CALL_COMPLETED', 'EMAIL_SENT', 'WHATSAPP_INTERACTION', 'MEETING_SCHEDULED'];
    if (type && SIGNIFICANT_TYPES.includes(type)) {
      await prisma.opportunity.updateMany({
        where: { customerId: customer.id, status: 'OPEN' },
        data: { lastSignificantActivityAt: new Date() }
      });
    }

    return {
      id: interaction.id,
      customerId: interaction.customerId,
      text: interaction.text,
      authorId: interaction.authorId,
      createdAt: interaction.createdAt,
    };
  }

  async getInteractions(idOrExtId: string | number | null, journeyId?: string | null): Promise<CrmInteraction[]> {
    if (idOrExtId === null) return [];

    const interactions = await prisma.interaction.findMany({
      where: {
        customer: typeof idOrExtId === 'string' 
          ? { id: idOrExtId }
          : {
              externalPersonId: idOrExtId,
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

  async updateCustomer(idOrExtId: string | number | null, data: Partial<CrmCustomer>, journeyId?: string | null): Promise<CrmCustomer> {
    const customer = await this.findOrCreateCustomer(idOrExtId, journeyId);

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
        humanTakeover: data.humanTakeover !== undefined ? data.humanTakeover : undefined,
        lostReason: data.lostReason,
      },
    });

    const oppData: any = {};
    if (data.stage !== undefined) oppData.stage = data.stage;
    if (data.assigneeId !== undefined) oppData.assigneeId = data.assigneeId;
    if (data.pipelineId !== undefined) oppData.pipelineId = data.pipelineId;
    if (data.lossReason !== undefined) oppData.lossReason = data.lossReason;
    if (data.freezeReason !== undefined) oppData.freezeReason = data.freezeReason;
    if (data.humanTakeover !== undefined) oppData.humanTakeover = data.humanTakeover;
    if (data.lostReason !== undefined) oppData.lossReason = data.lostReason;
    
    if (data.tag === 'CANCELED_CLIENT') oppData.status = 'LOST';
    if (data.stage === 'ganho') oppData.status = 'WON';
    if (data.stage === 'perdido') oppData.status = 'LOST';
    
    if (Object.keys(oppData).length > 0) {
      await prisma.opportunity.updateMany({
        where: { customerId: customer.id },
        data: oppData
      });

      if (oppData.status === 'WON') {
        try {
          await CustomerRevenueService.recalculateLTV(customer.id);
        } catch (err) {
          console.error('[PrismaCrmRepository] Error recalculating LTV on customer update:', err);
        }
      }
    }

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

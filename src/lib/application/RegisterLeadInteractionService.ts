import { ICrmRepository, InteractionType, LossReason } from '@/lib/domain/crm.types';
import { PrismaCrmRepository } from '@/lib/repositories/PrismaCrmRepository';
import { CrmEventDispatcher } from '@/lib/domain/crm.events';
import prisma from '@/lib/prisma';

export class RegisterLeadInteractionService {
  private crmRepo: ICrmRepository;

  constructor(crmRepo?: ICrmRepository) {
    this.crmRepo = crmRepo || new PrismaCrmRepository();
  }

  async execute(
    externalPersonId: number,
    authorId: string,
    type: InteractionType,
    note?: string,
    lossReason?: LossReason,
    scheduledFor?: Date
  ) {
    // 1. Get current lead state
    let leadState = await this.crmRepo.getLeadState(externalPersonId);
    
    // 2. Map InteractionType to Stage
    let nextStage = leadState?.stage || 'novo_cadastro';
    if (type === 'CONTACT_ATTEMPT') {
      nextStage = 'primeiro_contato';
    } else if (type === 'MEETING_SCHEDULED') {
      nextStage = 'em_negociacao';
    } else if (type === 'LOST') {
      nextStage = 'perdido';
    } else if (type === 'RECOVERED') {
      nextStage = 'ganho';
    } else if (type === 'CONTACTED') {
      nextStage = 'primeiro_contato';
    } else if (type === 'FOLLOW_UP') {
      nextStage = 'em_negociacao';
    }

    // 3. Write default message based on Type if no note is provided
    let text = note;
    if (!text || text.trim() === '') {
      if (type === 'CONTACT_ATTEMPT') text = 'Tentativa de contato realizada (Sem Nota).';
      else if (type === 'MEETING_SCHEDULED') {
        const formattedDate = scheduledFor ? new Date(scheduledFor).toLocaleString('pt-BR') : 'não informada';
        text = `Retorno agendado com o lead para: ${formattedDate} (Sem Nota).`;
      }
      else if (type === 'LOST') text = `Lead marcado como perdido. Motivo: ${lossReason || 'Não especificado'}.`;
      else if (type === 'RECOVERED') text = 'Lead ganho! Assinatura ativada.';
      else if (type === 'CONTACTED') text = 'Contato estabelecido com sucesso.';
      else if (type === 'FOLLOW_UP') text = 'Follow-up de negociação realizado.';
      else text = `Interação comercial registrada: ${type}`;
    }

    // 4. Record the interaction in timeline (adds note, updates lastInteractionAt, increments interactionCount)
    await this.crmRepo.addInteraction(externalPersonId, text, authorId);

    // 5. Update state of the lead (stage, lossReason if LOST, scheduledFor if MEETING_SCHEDULED)
    const finalScheduledFor = type === 'MEETING_SCHEDULED' 
      ? (scheduledFor || null) 
      : (type === 'LOST' || type === 'RECOVERED' ? null : (leadState?.scheduledFor || null));

    leadState = await this.crmRepo.updateLeadState(externalPersonId, {
      stage: nextStage,
      lossReason: type === 'LOST' ? lossReason : null,
      lastInteractionAt: new Date(),
      scheduledFor: finalScheduledFor,
    });

    const dbLead = await prisma.leadState.findUnique({
      where: { externalPersonId }
    });

    const isFinalStage = nextStage === 'ganho' || nextStage === 'perdido' || type === 'LOST' || type === 'RECOVERED';
    if (isFinalStage && dbLead) {
      await prisma.leadState.update({
        where: { id: dbLead.id },
        data: {
          campaignId: null,
          joinedCampaignAt: null,
          frozenUntil: null,
          freezeReason: null
        }
      });
      await prisma.taskAlert.deleteMany({
        where: {
          leadStateId: dbLead.id,
          status: 'PENDING'
        }
      });
    }

    if (type === 'MEETING_SCHEDULED' && scheduledFor && dbLead) {
      await prisma.taskAlert.deleteMany({
        where: {
          leadStateId: dbLead.id,
          status: 'PENDING',
          stepId: null
        }
      });

      await prisma.taskAlert.create({
        data: {
          leadStateId: dbLead.id,
          assignedToId: authorId,
          scheduledFor: new Date(scheduledFor),
          taskType: 'RETORNO',
          status: 'PENDING'
        }
      });
    }

    // 6. Dispatch domain event
    CrmEventDispatcher.dispatch({
      eventName: 'LeadInteractionRecordedEvent',
      externalPersonId,
      type,
      authorId,
      stage: nextStage,
      lossReason: type === 'LOST' ? lossReason : undefined,
      timestamp: new Date(),
    });

    return leadState;
  }
}

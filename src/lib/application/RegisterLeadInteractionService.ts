import { ICrmRepository, InteractionType, LossReason } from '@/lib/domain/crm.types';
import { PrismaCrmRepository } from '@/lib/repositories/PrismaCrmRepository';
import { CrmEventDispatcher } from '@/lib/domain/crm.events';
import prisma from '@/lib/prisma';
import pool from '@/lib/db';
import { NotificationService } from '@/lib/services/NotificationService';
import { JourneyTransitionService } from '@/lib/services/JourneyTransitionService';

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
    scheduledFor?: Date,
    journeyId?: string | null
  ) {
    // 1. Get current customer state
    let customer = await this.crmRepo.getCustomer(externalPersonId, journeyId);
    
    // 2. Map InteractionType to Stage
    let nextStage = customer?.stage || 'novo_cadastro';
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

    // 4. Record the interaction in timeline
    await this.crmRepo.addInteraction(externalPersonId, text, authorId, journeyId);

    // 5. Update state of the customer
    const finalScheduledFor = type === 'MEETING_SCHEDULED' 
      ? (scheduledFor || null) 
      : (type === 'LOST' || type === 'RECOVERED' ? null : (customer?.scheduledFor || null));

    const isHumanTakeover = !!authorId;

    customer = await this.crmRepo.updateCustomer(externalPersonId, {
      stage: nextStage,
      lossReason: type === 'LOST' ? lossReason : null,
      lastInteractionAt: new Date(),
      scheduledFor: finalScheduledFor,
      humanTakeover: isHumanTakeover ? true : undefined,
    }, journeyId);

    const dbCustomer = await prisma.customer.findFirst({
      where: { externalPersonId, journeyId: journeyId || null }
    });

    // Cancel pending automation tasks if human took over
    if (isHumanTakeover && dbCustomer) {
      await prisma.task.deleteMany({
        where: {
          customerId: dbCustomer.id,
          status: 'PENDING',
          taskType: { not: 'RETORNO' } // Mantenha tarefas manuais de retorno, mas remova automações
        }
      });
    }

    if (dbCustomer && (type as string) !== 'SYSTEM' && (type as string) !== 'POST_SALE' && (type as string) !== 'CS_FOLLOW_UP') {
      const activeCsOpp = await prisma.opportunity.findFirst({
        where: {
          customerId: dbCustomer.id,
          status: 'OPEN',
          pipeline: {
            name: { in: ['CS', 'CS/Pós-Vendas', 'Pós-Vendas', 'Pós-Venda'] }
          }
        }
      });

      if (activeCsOpp) {
        console.log(`[RevOps Cross-Sell] Interação comercial de agente registrada para o cliente ${dbCustomer.id} que possui CS ativo. Forçando humanTakeover e sinalizando conflito.`);
        await prisma.customer.update({
          where: { id: dbCustomer.id },
          data: { humanTakeover: true }
        });

        const currentMeta = (activeCsOpp.metadata as Record<string, any>) || {};
        await prisma.opportunity.update({
          where: { id: activeCsOpp.id },
          data: {
            metadata: {
              ...currentMeta,
              hasParallelNegotiation: true
            }
          }
        });
      }
    }

    const isFinalStage = nextStage === 'ganho' || nextStage === 'perdido' || type === 'LOST' || type === 'RECOVERED';
    if (isFinalStage && dbCustomer) {
      const finalJourneyId = journeyId || dbCustomer.journeyId || null;
      const transStage = (nextStage === 'ganho' || type === 'RECOVERED') ? 'ganho' : 'perdido';

      if (lossReason === 'DISCARD') {
        // Tag as DISCARDED and clear tasks/journey, skip transition & WhatsApp flows
        await prisma.task.deleteMany({
          where: {
            customerId: dbCustomer.id,
            status: 'PENDING'
          }
        });

        if (dbCustomer.journeyId !== null) {
          // Merge to generic, setting tag to DISCARDED
          await JourneyTransitionService.mergeCustomerToGeneric(
            dbCustomer.id,
            externalPersonId,
            'perdido',
            authorId
          );
          // Set tag as DISCARDED on the generic record
          await prisma.customer.updateMany({
            where: { externalPersonId, journeyId: null },
            data: { tag: 'DISCARDED', lostReason: 'DISCARD' }
          });
        } else {
          await prisma.customer.update({
            where: { id: dbCustomer.id },
            data: {
              stage: 'perdido',
              lostReason: 'DISCARD',
              tag: 'DISCARDED',
              joinedJourneyAt: null,
              frozenUntil: null,
              freezeReason: null
            }
          });
        }
      } else {
        // Enviar fluxo padrão (WhatsApp oficial via Meta) de forma assíncrona
        try {
          const [personRows]: any = await pool.query(
            'SELECT phoneNumber, fullName FROM people WHERE id = ? LIMIT 1',
            [externalPersonId]
          );
          const person = personRows[0];
          if (person && person.phoneNumber) {
            if (transStage === 'ganho') {
              const welcomeText = `Olá, ${person.fullName || 'Doutor(a)'}! Seja muito bem-vindo(a) ao DentalGO. É um prazer ter você conosco! Seu plano está ativo e começamos a nossa jornada de sucesso. Qualquer dúvida, estamos à inteira disposição!`;
              await NotificationService.sendMessage(person.phoneNumber, 'WHATSAPP', welcomeText, { provider: 'META' });
              console.log(`[Welcome WA] Enviado com sucesso para ${person.phoneNumber}`);
            } else if (transStage === 'perdido') {
              const cordialText = `Olá, ${person.fullName || 'Doutor(a)'}. Agradecemos muito pelo seu tempo e atenção durante o nosso contato. De qualquer forma, continuamos à sua inteira disposição! Foi muito bom conversar com você e desejamos muito sucesso em sua jornada.`;
              await NotificationService.sendMessage(person.phoneNumber, 'WHATSAPP', cordialText, { provider: 'META' });
              console.log(`[Cordial WA] Enviado com sucesso para ${person.phoneNumber}`);
            }
          }
        } catch (waErr) {
          console.error('[RegisterLeadInteractionService] WhatsApp dispatch error:', waErr);
        }

        // Run transition and merge/update
        await JourneyTransitionService.handleTransition(
          dbCustomer.id,
          externalPersonId,
          finalJourneyId,
          transStage,
          authorId
        );

        await prisma.task.deleteMany({
          where: {
            customerId: dbCustomer.id,
            status: 'PENDING'
          }
        });

        if (dbCustomer.journeyId !== null) {
          await JourneyTransitionService.mergeCustomerToGeneric(
            dbCustomer.id,
            externalPersonId,
            nextStage,
            authorId
          );
        } else {
          await prisma.customer.update({
            where: { id: dbCustomer.id },
            data: {
              stage: nextStage,
              joinedJourneyAt: null,
              frozenUntil: null,
              freezeReason: null
            }
          });
        }
      }
    }

    if (type === 'MEETING_SCHEDULED' && scheduledFor && dbCustomer) {
      await prisma.task.deleteMany({
        where: {
          customerId: dbCustomer.id,
          status: 'PENDING',
          journeyId: null,
          automationId: null
        }
      });

      await prisma.task.create({
        data: {
          customerId: dbCustomer.id,
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

    return customer;
  }
}

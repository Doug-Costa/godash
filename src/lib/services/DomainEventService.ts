import prisma from '@/lib/prisma';
import { CreateDomainEventInput } from '@/lib/domain/events';

export class DomainEventService {
  /**
   * Publica (persiste) um evento de domínio no banco de dados.
   * Feito de forma aditiva: erros aqui não devem quebrar a transação principal (fire and forget ou fail-safe).
   */
  static async publish(input: CreateDomainEventInput): Promise<void> {
    try {
      await prisma.domainEvent.create({
        data: {
          type: input.type,
          personId: input.personId,
          customerId: input.customerId,
          opportunityId: input.opportunityId,
          campaignId: input.campaignId,
          productId: input.productId,
          actorType: input.actorType,
          actorId: input.actorId,
          correlationId: input.correlationId,
          causationId: input.causationId,
          metadata: input.metadata ? input.metadata : undefined,
        }
      });
    } catch (error) {
      console.error(`[DomainEventService] Falha ao publicar evento ${input.type}:`, error);
      // Aqui poderíamos enviar para Sentry ou Datadog
      // Mas não damos throw para não interromper a esteira comercial.
    }
  }
}

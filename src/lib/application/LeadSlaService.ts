import { ICrmRepository } from '@/lib/domain/crm.types';
import { PrismaCrmRepository } from '@/lib/repositories/PrismaCrmRepository';
import { CrmEventDispatcher } from '@/lib/domain/crm.events';
import prisma from '@/lib/prisma';

export class LeadSlaService {
  private crmRepo: ICrmRepository;

  constructor(crmRepo?: ICrmRepository) {
    this.crmRepo = crmRepo || new PrismaCrmRepository();
  }

  async recycleIdleLeads(days: number = 5): Promise<number> {
    // 1. Get all customers where stage is in negotiations and has not had interactions for `days` days
    const expiredCustomers = await this.crmRepo.getExpiredSlaCustomers(days);

    if (expiredCustomers.length === 0) {
      return 0;
    }

    // Find a valid admin user to act as the author of the system message to prevent foreign key errors
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });
    const fallbackUser = await prisma.user.findFirst();
    const systemAuthorId = adminUser?.id || fallbackUser?.id;

    if (!systemAuthorId) {
      console.warn('[LeadSlaService] No users found in database to assign SLA recycle notes to.');
      return 0;
    }

    // 2. Loop through and recycle each
    for (const customer of expiredCustomers) {
      const previousAssigneeId = customer.assigneeId || null;
      const previousStage = customer.stage;

      // Reset assignee to null, reset stage to 'novo_cadastro', clear lossReason
      await this.crmRepo.updateCustomer(customer.externalPersonId, {
        stage: 'novo_cadastro',
        assigneeId: null,
        lossReason: null,
      });

      // Add a timeline comment
      await this.crmRepo.addInteraction(
        customer.externalPersonId,
        `Lead recolhido automaticamente pelo sistema por inatividade após ${days} dias (SLA expirado).`,
        systemAuthorId
      );

      // Dispatch domain event
      CrmEventDispatcher.dispatch({
        eventName: 'LeadRecycledByInactivityEvent',
        externalPersonId: customer.externalPersonId,
        previousAssigneeId,
        previousStage,
        timestamp: new Date(),
      });
    }

    return expiredCustomers.length;
  }
}

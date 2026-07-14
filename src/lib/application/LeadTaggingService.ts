import pool from '@/lib/db';
import { ICrmRepository, LeadTag } from '@/lib/domain/crm.types';
import { PrismaCrmRepository } from '@/lib/repositories/PrismaCrmRepository';
import { CrmEventDispatcher } from '@/lib/domain/crm.events';

export class LeadTaggingService {
  private crmRepo: ICrmRepository;

  constructor(crmRepo?: ICrmRepository) {
    this.crmRepo = crmRepo || new PrismaCrmRepository();
  }

  async tagLead(externalPersonId: number, journeyId?: string | null): Promise<LeadTag> {
    // 1. Query purchases for the person in MySQL database (Core)
    const [purchases] = await pool.query(
      `SELECT p.id, pl.title as planTitle
       FROM purchases p
       LEFT JOIN purchase_items pi ON pi.purchaseId = p.id
       LEFT JOIN product_items pit ON pi.productItemId = pit.id
       LEFT JOIN plans pl ON pit.productId = pl.id
       WHERE p.personId = ? AND p.status = 'success'`,
      [externalPersonId]
    );

    const purchaseList = purchases as any[];

    let tag: LeadTag = 'ABANDONED_CART';

    if (purchaseList.length > 0) {
      // Check if they purchased a digital book, magazine, or ebook
      const hasBook = purchaseList.some(item => {
        const title = (item.planTitle || '').toLowerCase();
        return title.includes('livro') || title.includes('ebook') || title.includes('book') || title.includes('revista');
      });

      if (hasBook) {
        tag = 'BOOK_CLIENT';
      }
    }

    // 2. Update the Customer tag
    await this.crmRepo.updateCustomer(externalPersonId, { tag }, journeyId);

    // 3. Dispatch domain event
    CrmEventDispatcher.dispatch({
      eventName: 'LeadTaggedEvent',
      externalPersonId,
      tag,
      timestamp: new Date(),
    });

    return tag;
  }
}

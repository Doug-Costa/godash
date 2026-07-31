import prisma from '@/lib/prisma';
import { Customer } from '@prisma/client';
import { IdentityResolutionService } from './IdentityResolutionService';

export class CustomerCreationService {
  /**
   * Safely create or merge a customer record.
   * Prevents duplicates by resolving identity first.
   */
  static async createOrMerge(data: {
    externalPersonId?: number;
    journeyId?: string | null;
    stage?: string;
    tag?: string;
    pipelineId?: string | null;
    metadata: Record<string, any>;
    source?: string; // e.g. "CSV", "API", "Manual"
    authorId?: string;
  }): Promise<Customer> {
    const { 
      externalPersonId, 
      journeyId = null, 
      stage = 'novo_cadastro', 
      tag, 
      pipelineId, 
      metadata,
      source = 'Sistema',
      authorId
    } = data;

    // 1. Resolve Identity
    const existingCustomer = await IdentityResolutionService.resolveIdentity({
      externalPersonId,
      phoneNumber: metadata?.phoneNumber,
      email: metadata?.email
    });

    if (existingCustomer) {
      // MERGE / ENRICHMENT
      
      // Update metadata (merge old and new)
      const mergedMetadata = {
        ...(existingCustomer.metadata as Record<string, any> || {}),
        ...metadata,
      };

      // We ONLY update metadata and interaction count. 
      // We don't overwrite stage or assignee to not disrupt ongoing sales.
      const updated = await prisma.customer.update({
        where: { id: existingCustomer.id },
        data: {
          metadata: mergedMetadata,
          interactionCount: { increment: 1 }
        }
      });

      // Register interaction for the merge
      await prisma.interaction.create({
        data: {
          customerId: updated.id,
          text: `Tentativa de importação/criação via ${source} recebida. Dados mesclados com o cadastro existente.`,
          authorId: authorId || null,
          type: 'SYSTEM'
        }
      });

      console.log(`[IdentityResolution] Merged new data into existing customer ${updated.id} (Ext ID: ${updated.externalPersonId})`);
      return updated;
    }

    // CREATE NEW
    if (!externalPersonId) {
      throw new Error('externalPersonId is required for new customers (for backward compatibility).');
    }

    const created = await prisma.customer.create({
      data: {
        externalPersonId,
        journeyId,
        stage,
        tag,
        pipelineId,
        metadata
      }
    });

    console.log(`[IdentityResolution] Created NEW customer ${created.id} (Ext ID: ${created.externalPersonId})`);
    return created;
  }
}

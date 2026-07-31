import prisma from '@/lib/prisma';
import { Customer } from '@prisma/client';
import { IdentityResolutionService } from './IdentityResolutionService';

export class CustomerCreationService {
  /**
   * Safely create or merge a customer record.
   * Prevents duplicates by resolving identity first.
   * If pipelineId is provided, it creates an Opportunity for that pipeline (V4 CDP Architecture).
   */
  static async createOrMerge(data: {
    externalPersonId?: number;
    journeyId?: string | null;
    stage?: string;
    tag?: string;
    pipelineId?: string | null;
    metadata: Record<string, any>;
    source?: string; // e.g. "DENTALGO", "CSV", "MANUAL", "LP"
    authorId?: string;
    productId?: string;
    sourceCampaignId?: string;
  }) {
    const { 
      externalPersonId, 
      journeyId = null, 
      stage = 'novo_cadastro', 
      tag, 
      pipelineId, 
      metadata,
      source = 'DENTALGO',
      authorId,
      productId,
      sourceCampaignId
    } = data;

    // 1. Resolve Identity
    const existingCustomer = await IdentityResolutionService.resolveIdentity({
      externalPersonId,
      phoneNumber: metadata?.phoneNumber,
      email: metadata?.email
    });

    let customerId: string;

    if (existingCustomer) {
      // MERGE / ENRICHMENT
      const mergedMetadata = {
        ...(existingCustomer.metadata as Record<string, any> || {}),
        ...metadata,
      };

      const updated = await prisma.customer.update({
        where: { id: existingCustomer.id },
        data: {
          metadata: mergedMetadata,
          interactionCount: { increment: 1 }
        }
      });
      
      customerId = updated.id;
      console.log(`[IdentityResolution] Merged new data into existing customer ${customerId}`);
    } else {
      // CREATE NEW CUSTOMER
      const created = await prisma.customer.create({
        data: {
          externalPersonId,
          source,
          journeyId,
          stage, // Legacy field
          tag,
          pipelineId, // Legacy field
          metadata
        }
      });
      
      customerId = created.id;
      console.log(`[IdentityResolution] Created NEW customer ${customerId}`);
    }
    
    // 2. Register Interaction
    await prisma.interaction.create({
      data: {
        customerId,
        text: `Tentativa de importação/criação via ${source} processada.`,
        authorId: authorId || null,
        type: 'SYSTEM'
      }
    });

    // 3. Create Opportunity (if pipeline is provided)
    if (pipelineId) {
      const existingOpp = await prisma.opportunity.findFirst({
        where: { customerId, pipelineId }
      });

      if (!existingOpp) {
        await prisma.opportunity.create({
          data: {
            customerId,
            pipelineId,
            stage,
            productId,
            sourceCampaignId
          }
        });
        console.log(`[Opportunity] Created new Opportunity for customer ${customerId} in pipeline ${pipelineId}`);
      } else {
        console.log(`[Opportunity] Customer ${customerId} already has an Opportunity in pipeline ${pipelineId}`);
      }
    }

    return await prisma.customer.findUnique({ where: { id: customerId } });
  }
}

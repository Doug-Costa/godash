import prisma from '@/lib/prisma';
import { Customer, SaleChannel } from '@prisma/client';
import { IdentityResolutionService } from './IdentityResolutionService';
import { CustomerRevenueService } from './CustomerRevenueService';

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
    pricePaid?: number;
    saleChannel?: SaleChannel;
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
      sourceCampaignId,
      pricePaid,
      saleChannel
    } = data;

    // 1. Resolve Identity (Person-based CDP V4)
    const fullName = metadata?.fullName || metadata?.name || null;
    const email = metadata?.email || null;
    const phoneNumber = metadata?.phoneNumber || metadata?.phone || null;

    const resolution = await IdentityResolutionService.resolve({
      externalPersonId,
      email,
      phoneNumber,
      fullName
    });

    let personId: string;

    if (resolution.action === 'FOUND' && resolution.person) {
      personId = resolution.person.id;
      // Enrich Person details if there are new signals
      await IdentityResolutionService.registerAlias(personId, {
        source,
        externalId: externalPersonId ? String(externalPersonId) : undefined,
        email,
        phone: phoneNumber,
        name: fullName,
        rawData: metadata
      });
    } else {
      // Create new canonical Person
      const cleanEmail = IdentityResolutionService.normalizeEmail(email);
      const cleanPhone = IdentityResolutionService.normalizePhone(phoneNumber);
      const newPerson = await prisma.person.create({
        data: {
          externalPersonId: externalPersonId || null,
          fullName,
          email: cleanEmail,
          phoneNumber: cleanPhone,
          source,
          identityAliases: (cleanEmail || cleanPhone || fullName) ? {
            create: {
              source,
              externalId: externalPersonId ? String(externalPersonId) : `gen_${Math.random().toString(36).substring(2, 11)}`,
              email: cleanEmail,
              phone: cleanPhone,
              name: fullName,
              rawData: metadata as any
            }
          } : undefined
        }
      });
      personId = newPerson.id;
    }

    // Find if there is an existing Customer for this Person and journey
    let existingCustomer = await prisma.customer.findFirst({
      where: {
        personId,
        journeyId: journeyId || undefined
      }
    });

    // Fallback: search by legacy externalPersonId
    if (!existingCustomer && externalPersonId) {
      existingCustomer = await prisma.customer.findFirst({
        where: { externalPersonId }
      });
    }

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
          personId,
          metadata: mergedMetadata,
          interactionCount: { increment: 1 }
        }
      });
      
      customerId = updated.id;
      console.log(`[IdentityResolution] Merged new data into existing customer ${customerId} (Person: ${personId})`);
    } else {
      // CREATE NEW CUSTOMER
      const created = await prisma.customer.create({
        data: {
          personId,
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
      console.log(`[IdentityResolution] Created NEW customer ${customerId} (Person: ${personId})`);
    }
    
    // 2. Register Purchase (CustomerProduct & LTV)
    if (productId) {
      try {
        const product = await prisma.product.findUnique({
          where: { id: productId }
        });
        if (product) {
          const finalPricePaid = pricePaid ?? product.basePrice ?? product.price ?? 0;
          await CustomerRevenueService.registerPurchase({
            customerId,
            productId,
            pricePaid: finalPricePaid
          });
        }
      } catch (err) {
        console.error('[CustomerCreationService] Error registering customer product purchase:', err);
      }
    }
    
    // 3. Register Interaction
    await prisma.interaction.create({
      data: {
        customerId,
        text: `Tentativa de importação/criação via ${source} processada.`,
        authorId: authorId || null,
        type: 'SYSTEM'
      }
    });

    // 4. Create Opportunity (if pipeline is provided)
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
            sourceCampaignId,
            pricePaid,
            value: pricePaid,
            saleChannel
          }
        });
        console.log(`[Opportunity] Created new Opportunity for customer ${customerId} in pipeline ${pipelineId}`);

        // RevOps Cross-Sell Conflict Detection:
        // Se a oportunidade que estamos criando for no pipeline Vendas/Comercial,
        // verificamos se o cliente já possui um atendimento ativo de pós-venda (CS).
        const targetPipeline = await prisma.pipeline.findUnique({ where: { id: pipelineId } });
        const isVendas = targetPipeline?.name === 'Vendas' || targetPipeline?.name?.toLowerCase().includes('venda') || targetPipeline?.name?.toLowerCase().includes('comercial');

        if (isVendas) {
          const activeCsOpp = await prisma.opportunity.findFirst({
            where: {
              customerId,
              status: 'OPEN',
              pipeline: {
                name: { in: ['CS', 'CS/Pós-Vendas', 'Pós-Vendas', 'Pós-Venda'] }
              }
            }
          });

          if (activeCsOpp) {
            console.log(`[RevOps Cross-Sell] Conflito detectado: Lead ${customerId} com negociação ativa em CS. Ativando humanTakeover e sinalizando oportunidade.`);
            await prisma.customer.update({
              where: { id: customerId },
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
      } else {
        console.log(`[Opportunity] Customer ${customerId} already has an Opportunity in pipeline ${pipelineId}`);
      }
    }

    return await prisma.customer.findUnique({ where: { id: customerId } });
  }
}

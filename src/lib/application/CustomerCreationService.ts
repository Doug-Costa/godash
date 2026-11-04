import prisma from '@/lib/prisma';
import { Customer, SaleChannel } from '@prisma/client';
import { randomUUID } from 'crypto';
import { CanonicalIdentityService, PROVISIONAL_PERSON_PREFIX } from '@/lib/services/CanonicalIdentityService';
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
    isPurchase?: boolean;
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
      saleChannel,
      isPurchase = true
    } = data;

    // 1. Identidade: o mesmo motor das importações (src/lib/services/CanonicalIdentityService.ts)
    //  - com ID do DentalGO (sincronização): pela ficha desse ID (FATO) ou pelo motor;
    //  - sem ID (formulário): pelo motor, com um alias único por envio.
    // O motor só junta com e-mail igual + nome compatível. Caso duvidoso fica numa ficha
    // provisória isolada com revisão — antes, a revisão era criada E o lead já ia para a
    // ficha candidata (fusão antes da revisão), e a revisão não encontrava o lead (ids diferentes).
    // Dados canônicos de quem veio do DentalGO/ERP não são sobrescritos (só campos vazios).
    const fullName = metadata?.fullName || metadata?.name || null;
    const email = metadata?.email || null;
    const phoneNumber = metadata?.phoneNumber || metadata?.phone || null;

    const person = externalPersonId
      ? await CanonicalIdentityService.resolveDentalGoPerson(externalPersonId, { fullName, email, phoneNumber })
      : await CanonicalIdentityService.resolve({
          source,
          externalId: `submission:${randomUUID()}`,
          email,
          phone: phoneNumber,
          name: fullName,
          rawData: metadata,
        });
    const personId = person.id;

    // Revisão aberta para esta ficha provisória (marca o cadastro e a oportunidade)
    const reviewRecord = await prisma.identityReview.findFirst({
      where: { status: 'PENDING', evidences: { array_contains: [`${PROVISIONAL_PERSON_PREFIX}${personId}`] } },
      select: { id: true, evidences: true },
    });
    const reviewReason = reviewRecord
      ? ((reviewRecord.evidences as string[]).find(e => e.startsWith('REASON:'))?.slice('REASON:'.length)
        || 'Contatos batem com mais de uma ficha')
      : null;

    const enrichedMetadata = {
      ...metadata,
      ...(reviewRecord ? {
        hasPendingReview: true,
        identityReviewId: reviewRecord.id,
        identityResolutionAction: 'REVIEW_REQUIRED',
        reviewReason
      } : {})
    };

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
        ...enrichedMetadata,
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
          metadata: enrichedMetadata
        }
      });
      
      customerId = created.id;
      console.log(`[IdentityResolution] Created NEW customer ${customerId} (Person: ${personId})`);
    }
    
    // 2. Register Purchase (CustomerProduct & LTV)
    if (productId && isPurchase !== false) {
      try {
        const product = await prisma.product.findUnique({
          where: { id: productId }
        });
        if (product) {
          const finalPricePaid = pricePaid ?? product.basePrice ?? product.price ?? 0;
          await CustomerRevenueService.registerPurchase({
            customerId,
            productId,
            pricePaid: finalPricePaid,
            authorId,
            source,
            saleChannel
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

    // 4. Create Opportunity with Submission Snapshot (if pipeline is provided)
    let createdOpportunityId: string | null = null;
    if (pipelineId) {
      const submissionSnapshot = {
        submittedName: fullName || metadata?.fullName || metadata?.name || '',
        submittedEmail: email || metadata?.email || '',
        submittedPhone: phoneNumber || metadata?.phoneNumber || metadata?.phone || '',
        capturedAt: new Date().toISOString(),
        source,
        lastFormId: metadata?.lastFormId || null,
        lastFormName: metadata?.lastFormName || null,
        ...(reviewRecord ? {
          hasPendingReview: true,
          identityReviewId: reviewRecord.id,
          identityResolutionAction: 'REVIEW_REQUIRED',
          reviewReason
        } : {})
      };

      const existingOpp = await prisma.opportunity.findFirst({
        where: { customerId, pipelineId, productId: productId || null, status: 'OPEN' }
      });

      if (!existingOpp) {
        const newOpp = await prisma.opportunity.create({
          data: {
            customerId,
            pipelineId,
            stage,
            productId,
            sourceCampaignId,
            pricePaid,
            value: pricePaid,
            saleChannel,
            metadata: submissionSnapshot
          }
        });
        createdOpportunityId = newOpp.id;
        console.log(`[Opportunity] Created new Opportunity ${newOpp.id} for customer ${customerId} in pipeline ${pipelineId}`);

        // RevOps Cross-Sell Conflict Detection:
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
        createdOpportunityId = existingOpp.id;
        console.log(`[Opportunity] Customer ${customerId} already has an Opportunity ${existingOpp.id} in pipeline ${pipelineId}. Updating submission snapshot.`);
        
        // Atualiza a oportunidade aberta com o snapshot mais recente
        const existingMeta = (existingOpp.metadata as Record<string, any>) || {};
        await prisma.opportunity.update({
          where: { id: existingOpp.id },
          data: {
            metadata: {
              ...existingMeta,
              ...submissionSnapshot
            }
          }
        });
      }
    }

    const customerRecord: any = await prisma.customer.findUnique({ 
      where: { id: customerId },
      include: {
        person: true,
        opportunities: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (customerRecord) {
      customerRecord.lastCreatedOpportunityId = createdOpportunityId;
    }

    return customerRecord;
  }
}

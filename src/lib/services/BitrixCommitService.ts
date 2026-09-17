import prisma from '@/lib/prisma';
import { CanonicalIdentityService } from './CanonicalIdentityService';
import { BitrixProcessedDeal } from '@/lib/domain/BitrixImportContract';
import { createHash } from 'node:crypto';

export class BitrixCommitService {
  /**
   * Efetiva a gravação transacional e idempotente do lote Bitrix.
   */
  static async commit(params: {
    fileName: string;
    uploadedById?: string;
    targetPipelineId?: string;
    deals: BitrixProcessedDeal[];
  }) {
    const { fileName, uploadedById, targetPipelineId, deals } = params;

    // 1. Garantir existência de um Pipeline padrão para o CRM
    let pipelineId = targetPipelineId;
    if (!pipelineId) {
      const defaultPipeline = await prisma.pipeline.findFirst({
        where: { name: { contains: 'Vendas', mode: 'insensitive' } }
      }) || await prisma.pipeline.findFirst();

      if (!defaultPipeline) {
        const createdPipeline = await prisma.pipeline.create({
          data: { name: 'Vendas (Bitrix Migrado)', description: 'Funil Comercial de Transição Bitrix' }
        });
        pipelineId = createdPipeline.id;
      } else {
        pipelineId = defaultPipeline.id;
      }
    }

    // 2. Hash determinístico do lote para rastreamento de lote
    const fileHash = createHash('sha256')
      .update(JSON.stringify({ fileName, count: deals.length, firstId: deals[0]?.bitrixDealId }))
      .digest('hex');

    const previousBatch = await prisma.importBatch.findUnique({ where: { fileHash } });
    const batch = previousBatch
      ? await prisma.importBatch.update({
          where: { id: previousBatch.id },
          data: { status: 'IMPORTING', totalRows: deals.length, successRows: 0, errorRows: 0 }
        })
      : await prisma.importBatch.create({
          data: {
            fileName,
            fileHash,
            schemaVersion: 'v4-bitrix',
            uploadedById: uploadedById || null,
            status: 'IMPORTING',
            totalRows: deals.length
          }
        });

    let successRows = 0;
    let errorRows = 0;
    let recoveredCount = 0;

    for (const deal of deals) {
      // Ignorar negócios sem contato algum que ficaram em revisão
      if (deal.operationalVisibility === 'REVIEW_REQUIRED' || !deal.personResolved) {
        errorRows++;
        continue;
      }

      try {
        await prisma.$transaction(async (tx) => {
          // A. Resolver/Criar Person canônica
          const person = await CanonicalIdentityService.resolve({
            source: 'BITRIX',
            externalId: deal.bitrixContactId || `snapshot_${deal.bitrixDealId}`,
            email: deal.personResolved?.email,
            phone: deal.personResolved?.phone,
            name: deal.personResolved?.fullName
          });

          // B. Registrar IdentityAlias do Deal para rastreabilidade 100% auditável
          await tx.identityAlias.upsert({
            where: {
              source_externalId: {
                source: 'BITRIX_DEAL',
                externalId: deal.bitrixDealId
              }
            },
            update: {
              personId: person.id,
              name: deal.personResolved?.fullName,
              email: deal.personResolved?.email || null,
              phone: deal.personResolved?.phone || null,
              rawData: deal.metadata
            },
            create: {
              source: 'BITRIX_DEAL',
              externalId: deal.bitrixDealId,
              personId: person.id,
              name: deal.personResolved?.fullName,
              email: deal.personResolved?.email || null,
              phone: deal.personResolved?.phone || null,
              rawData: deal.metadata
            }
          });

          // C. Buscar ou criar Customer vinculado à Person
          let customer = await tx.customer.findFirst({
            where: { personId: person.id }
          });

          if (!customer) {
            customer = await tx.customer.create({
              data: {
                personId: person.id,
                source: 'BITRIX',
                stage: deal.stage,
                assigneeId: deal.assignedToUserId || null,
                pipelineId: pipelineId,
                humanTakeover: deal.humanTakeover,
                metadata: {
                  batchId: batch.id,
                  interestTags: deal.productResolution.interestTags
                }
              }
            });
          }

          // D. Criar ou Atualizar a Opportunity vinculada
          // Usamos o metadata.legacyDealId para garantir idempotência de negócios
          const existingOpp = await tx.opportunity.findFirst({
            where: {
              customerId: customer.id,
              metadata: {
                path: ['legacyDealId'],
                equals: deal.bitrixDealId
              }
            }
          });

          const oppData = {
            customerId: customer.id,
            pipelineId: pipelineId!,
            stage: deal.stage,
            status: deal.status,
            value: deal.value,
            assigneeId: deal.assignedToUserId || customer.assigneeId || null,
            productId: deal.productResolution.productId || null,
            lossReason: deal.metadata.legacyLossReason || null,
            humanTakeover: deal.humanTakeover,
            utmSource: deal.utm.source || null,
            utmMedium: deal.utm.medium || null,
            utmCampaign: deal.utm.campaign || null,
            utmContent: deal.utm.content || null,
            utmTerm: deal.utm.term || null,
            metadata: {
              ...deal.metadata,
              batchId: batch.id,
              legacyDealId: deal.bitrixDealId,
              legacyTitle: deal.productResolution.legacyDealTitle,
              interestTags: deal.productResolution.interestTags,
              operationalVisibility: deal.operationalVisibility,
              recoveredFromSnapshot: deal.personResolved?.recoveredFromSnapshot || false
            }
          };

          if (existingOpp) {
            await tx.opportunity.update({
              where: { id: existingOpp.id },
              data: oppData
            });
          } else {
            await tx.opportunity.create({
              data: oppData
            });
          }

          // E. Se for Venda Realizada (WON) com Produto Confirmado, registrar FATO de compra
          if (deal.status === 'WON' && deal.productResolution.productId) {
            const existingCP = await tx.customerProduct.findFirst({
              where: {
                customerId: customer.id,
                productId: deal.productResolution.productId
              }
            });

            if (!existingCP) {
              await tx.customerProduct.create({
                data: {
                  customerId: customer.id,
                  productId: deal.productResolution.productId,
                  status: 'ACTIVE',
                  pricePaid: deal.value > 0 ? deal.value : null,
                  startDate: deal.createdAt
                }
              });
            }
          }

          // F. Registrar DomainEvent de auditoria
          await tx.domainEvent.create({
            data: {
              type: 'BITRIX_DEAL_IMPORTED',
              personId: person.id,
              customerId: customer.id,
              actorType: 'IMPORT',
              actorId: uploadedById || null,
              metadata: {
                batchId: batch.id,
                bitrixDealId: deal.bitrixDealId,
                status: deal.status,
                stage: deal.stage,
                value: deal.value
              }
            }
          });
        });

        if (deal.personResolved.recoveredFromSnapshot) {
          recoveredCount++;
        }
        successRows++;
      } catch (err) {
        console.error(`[BitrixCommit] Erro no deal ${deal.bitrixDealId}:`, err);
        errorRows++;
      }
    }

    // Finalizar lote
    const updatedBatch = await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status: errorRows > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED',
        successRows,
        errorRows
      }
    });

    return {
      batchId: updatedBatch.id,
      totalProcessed: deals.length,
      successRows,
      errorRows,
      recoveredCount
    };
  }
}

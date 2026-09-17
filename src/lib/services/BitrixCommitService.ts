import prisma from '@/lib/prisma';
import { CanonicalIdentityService } from './CanonicalIdentityService';
import { BitrixProcessedDeal } from '@/lib/domain/BitrixImportContract';
import { createHash } from 'node:crypto';

export class BitrixCommitService {
  /**
   * Efetiva um lote/pedaço (chunk) de negócios do Bitrix com alta performance,
   * cache em memória por lote e transações isoladas para evitar timeouts de HTTP/Nginx.
   */
  static async commitChunk(params: {
    fileName: string;
    uploadedById?: string;
    targetPipelineId?: string;
    batchId?: string;
    deals: BitrixProcessedDeal[];
    isFirstChunk?: boolean;
    isLastChunk?: boolean;
    totalExpectedDeals?: number;
  }) {
    const { 
      fileName, 
      uploadedById, 
      targetPipelineId, 
      batchId: existingBatchId, 
      deals,
      isFirstChunk = true,
      isLastChunk = false,
      totalExpectedDeals = deals.length
    } = params;

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

    // 2. Gerenciar ImportBatch
    let batchId = existingBatchId;
    if (!batchId) {
      const fileHash = createHash('sha256')
        .update(JSON.stringify({ fileName, timestamp: new Date().toDateString(), total: totalExpectedDeals }))
        .digest('hex');

      const previousBatch = await prisma.importBatch.findUnique({ where: { fileHash } });
      const batch = previousBatch
        ? await prisma.importBatch.update({
            where: { id: previousBatch.id },
            data: { status: 'IMPORTING', totalRows: totalExpectedDeals, successRows: 0, errorRows: 0 }
          })
        : await prisma.importBatch.create({
            data: {
              fileName,
              fileHash,
              schemaVersion: 'v4-bitrix',
              uploadedById: uploadedById || null,
              status: 'IMPORTING',
              totalRows: totalExpectedDeals
            }
          });
      batchId = batch.id;
    }

    let successRows = 0;
    let errorRows = 0;
    let recoveredCount = 0;

    // Cache local em memória para evitar buscas redundantes na mesma requisição
    const personCache = new Map<string, any>();
    const customerCache = new Map<string, any>();

    // Processar em sub-lotes concorrentes de 10 para máxima velocidade no PostgreSQL
    const concurrency = 10;
    for (let i = 0; i < deals.length; i += concurrency) {
      const subChunk = deals.slice(i, i + concurrency);

      await Promise.all(
        subChunk.map(async (deal) => {
          if (deal.operationalVisibility === 'REVIEW_REQUIRED' || !deal.personResolved) {
            errorRows++;
            return;
          }

          try {
            const cacheKey = deal.bitrixContactId 
              ? `cid_${deal.bitrixContactId}` 
              : (deal.personResolved?.email || deal.personResolved?.phone || `snapshot_${deal.bitrixDealId}`);

            // A. Resolver Person canônica
            let person = personCache.get(cacheKey);
            if (!person) {
              person = await CanonicalIdentityService.resolve({
                source: 'BITRIX',
                externalId: deal.bitrixContactId || `snapshot_${deal.bitrixDealId}`,
                email: deal.personResolved?.email,
                phone: deal.personResolved?.phone,
                name: deal.personResolved?.fullName
              });
              personCache.set(cacheKey, person);
            }

            // B. Registrar IdentityAlias do Deal
            await prisma.identityAlias.upsert({
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
            let customer = customerCache.get(person.id);
            if (!customer) {
              customer = await prisma.customer.findFirst({
                where: { personId: person.id }
              });

              if (!customer) {
                customer = await prisma.customer.create({
                  data: {
                    personId: person.id,
                    source: 'BITRIX',
                    stage: deal.stage,
                    assigneeId: deal.assignedToUserId || null,
                    pipelineId: pipelineId,
                    humanTakeover: deal.humanTakeover,
                    metadata: {
                      batchId,
                      interestTags: deal.productResolution.interestTags
                    }
                  }
                });
              }
              customerCache.set(person.id, customer);
            }

            // D. Criar ou Atualizar a Opportunity vinculada
            const existingOpp = await prisma.opportunity.findFirst({
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
                batchId,
                legacyDealId: deal.bitrixDealId,
                legacyTitle: deal.productResolution.legacyDealTitle,
                interestTags: deal.productResolution.interestTags,
                operationalVisibility: deal.operationalVisibility,
                recoveredFromSnapshot: deal.personResolved?.recoveredFromSnapshot || false
              }
            };

            if (existingOpp) {
              await prisma.opportunity.update({
                where: { id: existingOpp.id },
                data: oppData
              });
            } else {
              await prisma.opportunity.create({
                data: oppData
              });
            }

            // E. Se for Venda Realizada (WON) com Produto Confirmado, registrar FATO de compra
            if (deal.status === 'WON' && deal.productResolution.productId) {
              const existingCP = await prisma.customerProduct.findFirst({
                where: {
                  customerId: customer.id,
                  productId: deal.productResolution.productId
                }
              });

              if (!existingCP) {
                await prisma.customerProduct.create({
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

            if (deal.personResolved?.recoveredFromSnapshot) {
              recoveredCount++;
            }
            successRows++;
          } catch (err) {
            console.error(`[BitrixCommitChunk] Erro no deal ${deal.bitrixDealId}:`, err);
            errorRows++;
          }
        })
      );
    }

    // Se for o último chunk, atualizar status do lote
    if (isLastChunk && batchId) {
      await prisma.importBatch.update({
        where: { id: batchId },
        data: {
          status: 'COMPLETED',
          successRows: { increment: successRows },
          errorRows: { increment: errorRows }
        }
      });
    } else if (batchId) {
      await prisma.importBatch.update({
        where: { id: batchId },
        data: {
          successRows: { increment: successRows },
          errorRows: { increment: errorRows }
        }
      });
    }

    return {
      batchId,
      chunkProcessed: deals.length,
      successRows,
      errorRows,
      recoveredCount
    };
  }
}

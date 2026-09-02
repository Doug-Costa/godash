import prisma from '@/lib/prisma';
import { CanonicalIdentityService } from './CanonicalIdentityService';
import { CustomerRevenueService } from './CustomerRevenueService';
import { RowPreflightResult } from './ImportPreflightService';
import { createHash } from 'node:crypto';

export class ImportCommitService {
  /**
   * Recebe a lista de linhas aprovadas do Preflight (onde status === 'READY' ou 'WARNING')
   * e as persiste de forma canônica no banco de dados.
   */
  static async commit(
    batchInfo: { 
      fileName: string; 
      schemaVersion: string; 
      uploadedById: string; 
      importDestination?: string; 
      productId?: string; 
      pipelineId?: string;
    }, 
    rows: RowPreflightResult[]
  ) {
    // 1. Hash determinístico: impede que um duplo clique/reupload replique compras.
    const fileHash = createHash('sha256').update(JSON.stringify({
      fileName: batchInfo.fileName,
      destination: batchInfo.importDestination,
      productId: batchInfo.productId,
      rows: rows.map(row => ({
        sourceRecordId: row.parsedData?.source_record_id,
        externalPersonId: row.parsedData?.externalPersonId,
        productId: row.resolvedProductId || row.parsedData?.product_id,
        status: row.parsedData?.enrollmentStatus
      }))
    })).digest('hex');

    const previousBatch = await prisma.importBatch.findUnique({ where: { fileHash } });
    if (previousBatch?.status === 'COMPLETED') {
      return {
        successRows: previousBatch.successRows,
        errorRows: previousBatch.errorRows,
        batchId: previousBatch.id,
        alreadyImported: true
      };
    }

    const batch = previousBatch
      ? await prisma.importBatch.update({
          where: { id: previousBatch.id },
          data: { status: 'IMPORTING', totalRows: rows.length, successRows: 0, errorRows: 0 }
        })
      : await prisma.importBatch.create({
          data: {
            fileName: batchInfo.fileName,
            fileHash,
            schemaVersion: batchInfo.schemaVersion || 'V4',
            uploadedById: batchInfo.uploadedById,
            status: 'IMPORTING',
            totalRows: rows.length
          }
        });

    let successRows = 0;
    let errorRows = 0;

    for (const row of rows) {
      if (row.status !== 'READY' && row.status !== 'WARNING') {
        errorRows++;
        continue;
      }

      try {
        await this.commitRow(
          row, 
          batchInfo.uploadedById, 
          batchInfo.importDestination, 
          batchInfo.productId, 
          batchInfo.pipelineId
        );
        successRows++;
      } catch (error) {
        console.error(`[ImportCommit] Erro ao comitar linha ${row.index}:`, error);
        errorRows++;
      }
    }

    // 2. Finaliza o lote
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status: errorRows === 0 ? 'COMPLETED' : (successRows > 0 ? 'COMPLETED' : 'FAILED'),
        successRows,
        errorRows
      }
    });

    return { successRows, errorRows, batchId: batch.id };
  }

  private static async commitRow(
    row: RowPreflightResult, 
    authorId: string, 
    importDestination?: string, 
    productId?: string, 
    pipelineId?: string
  ) {
    const data = row.parsedData;
    if (!data) throw new Error("Linha não tem parsedData.");

    const source = data.source_label || 'CSV_IMPORT';
    const externalId = data.externalPersonId 
      ? String(data.externalPersonId) 
      : (data.source_record_id || `row_${row.index}_${Date.now()}`);

    // 1. Identidade Canônica (Person)
    const person = await CanonicalIdentityService.resolve({
      source,
      externalId,
      email: data.email,
      phone: data.phone,
      name: data.name,
      rawData: row.originalData
    });

    // 2. Contexto Comercial (Customer)
    let customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { personId: person.id },
          ...(data.externalPersonId ? [{ externalPersonId: data.externalPersonId }] : [])
        ]
      }
    });

    const currentMetadata = (customer?.metadata as Record<string, any>) || {};
    const existingSpecialties: string[] = Array.isArray(currentMetadata.specialties) 
      ? currentMetadata.specialties 
      : (currentMetadata.specialty ? [currentMetadata.specialty] : []);
    const existingInterests: string[] = Array.isArray(currentMetadata.interests) 
      ? currentMetadata.interests 
      : [];

    const classifiedSpecialty = row.classifiedSpecialty || data.specialty;
    const confirmedSpecialty = data.enrollmentStatus === 'CANCELED' ? undefined : classifiedSpecialty;

    if (!customer) {
      const initialSpecialties = (importDestination === 'FATO' && confirmedSpecialty)
        ? [confirmedSpecialty]
        : [];
      const initialInterests = (importDestination !== 'FATO' && classifiedSpecialty)
        ? [classifiedSpecialty]
        : [];

      customer = await prisma.customer.create({
        data: {
          personId: person.id,
          externalPersonId: data.externalPersonId || null,
          source,
          stage: data.stage || 'novo_cadastro',
          metadata: {
            specialties: initialSpecialties,
            interests: initialInterests,
            sellerContract: data.sellerContract || undefined,
            importSourceRecordId: data.source_record_id || undefined
          }
        }
      });
    } else {
      // Atualiza metadados com as novas especialidades/interesses sem sobrescrever as anteriores
      let updatedSpecialties = existingSpecialties;
      let updatedInterests = existingInterests;

      if (importDestination === 'FATO' && confirmedSpecialty && !existingSpecialties.includes(confirmedSpecialty)) {
        updatedSpecialties = [...existingSpecialties, confirmedSpecialty];
      } else if (importDestination !== 'FATO' && classifiedSpecialty && !existingInterests.includes(classifiedSpecialty)) {
        updatedInterests = [...existingInterests, classifiedSpecialty];
      }

      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          // O alias canônico resolvido nesta importação é a fonte da identidade.
          // Preservar aqui uma Person legada vazia fazia nome/e-mail/telefone sumirem.
          personId: person.id,
          externalPersonId: customer.externalPersonId || data.externalPersonId || null,
          metadata: {
            ...currentMetadata,
            specialties: updatedSpecialties,
            interests: updatedInterests,
            sellerContract: data.sellerContract || currentMetadata.sellerContract,
            importSourceRecordId: data.source_record_id || currentMetadata.importSourceRecordId
          }
        }
      });
    }

    // 3. Fatos Comerciais
    const finalProductId = productId || row.resolvedProductId;
    const destination = importDestination || (data.fact_type === 'PURCHASE' ? 'FATO' : 'DESEJO');

    if (destination === 'FATO') {
      if (finalProductId) {
        const startDateValue = data.started_at || data.occurred_at;
        const parsedStartDate = startDateValue ? new Date(startDateValue) : new Date();
        const startDate = Number.isNaN(parsedStartDate.getTime()) ? new Date() : parsedStartDate;
        const purchaseStatus = data.enrollmentStatus === 'CANCELED'
          ? 'CANCELED'
          : data.enrollmentStatus === 'COMPLETED' ? 'COMPLETED' : 'ACTIVE';

        const existingPurchase = await prisma.customerProduct.findFirst({
          where: { customerId: customer.id, productId: finalProductId, startDate }
        });

        if (existingPurchase) {
          await prisma.customerProduct.update({
            where: { id: existingPurchase.id },
            data: { status: purchaseStatus, pricePaid: data.value ?? existingPurchase.pricePaid ?? 0 }
          });
          await CustomerRevenueService.recalculateLTV(customer.id);
        } else {
          await CustomerRevenueService.registerPurchase({
            customerId: customer.id,
            productId: finalProductId,
            pricePaid: data.value ?? 0,
            authorId,
            source: data.sellerContract ? `Importação CSV (Vendedor: ${data.sellerContract})` : source,
            startDate,
            status: purchaseStatus
          });
        }
      }
    } else {
      // DESEJO
      const finalPipelineId = pipelineId || 'default';
      
      let targetPipelineId = finalPipelineId;
      if (targetPipelineId === 'default') {
        const defaultPipe = await prisma.pipeline.findFirst({
          where: { name: 'Vendas' }
        }) || await prisma.pipeline.findFirst();
        targetPipelineId = defaultPipe?.id || '';
      }

      if (targetPipelineId) {
        const existingOpp = await prisma.opportunity.findFirst({
          where: { customerId: customer.id, pipelineId: targetPipelineId }
        });

        if (!existingOpp) {
          if (!customer.pipelineId) {
            await prisma.customer.update({
              where: { id: customer.id },
              data: { pipelineId: targetPipelineId }
            });
          }

          await prisma.opportunity.create({
            data: {
              customerId: customer.id,
              pipelineId: targetPipelineId,
              productId: finalProductId || null,
              status: data.enrollmentStatus === 'CANCELED' ? 'LOST' : 'OPEN',
              value: data.value || 0,
              assigneeId: authorId
            }
          });
        }
      }
    }
  }
}

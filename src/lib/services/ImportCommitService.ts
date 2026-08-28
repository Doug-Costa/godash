import prisma from '@/lib/prisma';
import { CanonicalIdentityService } from './CanonicalIdentityService';
import { CustomerRevenueService } from './CustomerRevenueService';
import { RowPreflightResult } from './ImportPreflightService';

export class ImportCommitService {
  /**
   * Recebe a lista de linhas aprovadas do Preflight (onde status === 'READY')
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
    // 1. Cria a auditoria do lote
    const fileHash = `hash_${Date.now()}`; // Na vida real, poderíamos receber o hash MD5 do arquivo
    const batch = await prisma.importBatch.create({
      data: {
        fileName: batchInfo.fileName,
        fileHash,
        schemaVersion: batchInfo.schemaVersion,
        uploadedById: batchInfo.uploadedById,
        status: 'IMPORTING',
        totalRows: rows.length
      }
    });

    let successRows = 0;
    let errorRows = 0;

    for (const row of rows) {
      if (row.status !== 'READY') {
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
    const externalId = data.source_record_id || `row_${row.index}_${Date.now()}`;

    // 1. Identidade Canônica (Person) - Agora executamos a mutação
    const person = await CanonicalIdentityService.resolve({
      source,
      externalId,
      email: data.email,
      phone: data.phone,
      name: data.name,
      rawData: row.originalData
    });

    // 2. Contexto Comercial (Customer)
    // Busca se a pessoa já tem um Customer sem pipeline específico ou se é novo
    let customer = await prisma.customer.findFirst({
      where: { personId: person.id }
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          personId: person.id,
          source,
          stage: data.stage || 'novo_cadastro',
          metadata: row.originalData
        }
      });
    }

    // 3. Fatos Comerciais
    const finalProductId = productId || row.resolvedProductId;
    const destination = importDestination || (data.fact_type === 'PURCHASE' ? 'FATO' : 'DESEJO');

    if (destination === 'FATO') {
      if (finalProductId) {
        await CustomerRevenueService.registerPurchase({
          customerId: customer.id,
          productId: finalProductId,
          pricePaid: data.value ?? 0, // Fallback se não for passado
          authorId,
          source
        });
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
        // Se a oportunidade para este pipeline já existe, não duplicamos
        const existingOpp = await prisma.opportunity.findFirst({
          where: { customerId: customer.id, pipelineId: targetPipelineId }
        });

        if (!existingOpp) {
          // Assegurar que o customer tenha o pipelineId setado se for nulo
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
              status: data.fact_status || 'OPEN',
              value: data.value || 0,
              assigneeId: authorId
            }
          });
        }
      }
    }
  }
}

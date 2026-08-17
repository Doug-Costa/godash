import Papa from 'papaparse';
import { CanonicalImportRow, ImportFactType } from '../domain/ImportContract';
import { CanonicalIdentityService } from './CanonicalIdentityService';
import { ProductResolverService } from './ProductResolverService';

export type RowPreflightStatus = 'READY' | 'WARNING' | 'ERROR' | 'REVIEW_REQUIRED';

export interface RowPreflightResult {
  index: number;
  originalData: Record<string, any>;
  parsedData: Partial<CanonicalImportRow> | null;
  status: RowPreflightStatus;
  errors: string[];
  warnings: string[];
  identityStatus: 'FOUND' | 'NOT_FOUND' | 'AMBIGUOUS' | 'NOT_REQUIRED';
  personId?: string;
  catalogStatus: 'FOUND' | 'UNKNOWN' | 'NOT_REQUIRED';
  resolvedProductId?: string;
  resolvedProductName?: string;
}

export interface PreflightSummary {
  totalRows: number;
  readyRows: number;
  warningRows: number;
  errorRows: number;
  reviewRows: number;
  results: RowPreflightResult[];
}

export class ImportPreflightService {
  /**
   * Executa o Pre-flight de um arquivo CSV.
   * Não altera o banco de dados.
   */
  static async analyzeCsv(csvContent: string): Promise<PreflightSummary> {
    return new Promise((resolve, reject) => {
      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const summary = await this.analyzeRows(results.data as any[]);
            resolve(summary);
          } catch (error) {
            reject(error);
          }
        },
        error: (error: any) => {
          reject(error);
        }
      });
    });
  }

  private static async analyzeRows(rows: any[]): Promise<PreflightSummary> {
    const results: RowPreflightResult[] = [];
    
    let readyRows = 0;
    let warningRows = 0;
    let errorRows = 0;
    let reviewRows = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const result = await this.analyzeRow(row, i);
      results.push(result);

      if (result.status === 'READY') readyRows++;
      else if (result.status === 'WARNING') warningRows++;
      else if (result.status === 'ERROR') errorRows++;
      else if (result.status === 'REVIEW_REQUIRED') reviewRows++;
    }

    return {
      totalRows: rows.length,
      readyRows,
      warningRows,
      errorRows,
      reviewRows,
      results
    };
  }

  private static async analyzeRow(rawRow: any, index: number): Promise<RowPreflightResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let status: RowPreflightStatus = 'READY';

    // Parse básico (mapeando colunas com fallback dinâmico básico)
    const email = rawRow.email?.toString()?.trim();
    const phone = rawRow.phone?.toString()?.trim() || rawRow.telefone?.toString()?.trim();
    const name = rawRow.name?.toString()?.trim() || rawRow.nome?.toString()?.trim();
    
    let factTypeStr = rawRow.fact_type?.toString()?.trim()?.toUpperCase() || 'OPPORTUNITY';
    if (!Object.values(ImportFactType).includes(factTypeStr as ImportFactType)) {
      errors.push(`Tipo de fato inválido: ${factTypeStr}. Fallback para OPPORTUNITY.`);
      factTypeStr = 'OPPORTUNITY';
      status = 'ERROR'; // Se o fato é inválido, não podemos confiar.
    }
    const factType = factTypeStr as ImportFactType;

    const valueStr = rawRow.value?.toString()?.trim() || rawRow.valor?.toString()?.trim();
    let value: number | undefined = undefined;
    if (valueStr) {
      const parsedValue = parseFloat(valueStr.replace(',', '.'));
      if (isNaN(parsedValue)) {
        errors.push(`Valor financeiro inválido: ${valueStr}`);
        status = 'ERROR';
      } else {
        value = parsedValue;
      }
    }

    const productName = rawRow.product_name?.toString()?.trim() || rawRow.produto?.toString()?.trim();
    const productId = rawRow.product_id?.toString()?.trim();

    // 1. Validar Identidade
    let identityStatus: 'FOUND' | 'NOT_FOUND' | 'AMBIGUOUS' | 'NOT_REQUIRED' = 'NOT_REQUIRED';
    let personId: string | undefined;

    if (!email && !phone) {
      errors.push('E-mail ou Telefone são obrigatórios para resolução de identidade.');
      status = 'ERROR';
    } else {
      const identityRes = await CanonicalIdentityService.inspect({
        source: rawRow.source_label || 'CSV_IMPORT',
        externalId: rawRow.source_record_id || `row_${index}`,
        email,
        phone,
        name
      });
      
      identityStatus = identityRes.status;
      personId = identityRes.personId;

      if (identityStatus === 'AMBIGUOUS') {
        errors.push('Identidade ambígua: Encontrados múltiplos perfis para este e-mail/telefone.');
        status = 'ERROR';
      } else if (identityStatus === 'NOT_FOUND') {
        warnings.push('Nova identidade será criada no banco de dados.');
        if (status === 'READY') status = 'WARNING';
      }
    }

    // 2. Validar Catálogo
    let catalogStatus: 'FOUND' | 'UNKNOWN' | 'NOT_REQUIRED' = 'NOT_REQUIRED';
    let resolvedProductId: string | undefined;
    let resolvedProductName: string | undefined;

    // Fatos que EXIGEM produto
    if (factType === 'PURCHASE' || factType === 'SUBSCRIPTION') {
      if (!productName && !productId) {
        errors.push(`Fato do tipo ${factType} exige um product_id ou product_name.`);
        status = 'ERROR';
      } else {
        const catalogRes = await ProductResolverService.resolve(productId || productName);
        catalogStatus = catalogRes.status;
        
        if (catalogStatus === 'FOUND' && 'productId' in catalogRes) {
          resolvedProductId = catalogRes.productId;
          resolvedProductName = catalogRes.productName;
        } else if (catalogStatus === 'UNKNOWN') {
          // Quando o catálogo é desconhecido e o fato EXIGE produto, a linha vai para HITL (Human In The Loop)
          status = 'REVIEW_REQUIRED';
        }
      }
    }

    // 3. Regras Específicas do Fato
    if (factType === 'PURCHASE' && value === undefined) {
      warnings.push('Fato PURCHASE sem valor financeiro definido. Isso pode distorcer o LTV se não for intencional (ex: cortesia).');
      if (status === 'READY') status = 'WARNING';
    }

    return {
      index,
      originalData: rawRow,
      parsedData: {
        name, email, phone, fact_type: factType, value, product_name: productName, product_id: productId
      },
      status,
      errors,
      warnings,
      identityStatus,
      personId,
      catalogStatus,
      resolvedProductId,
      resolvedProductName
    };
  }
}

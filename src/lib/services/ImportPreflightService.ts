import Papa from 'papaparse';
import { CanonicalImportRow, ImportFactType } from '../domain/ImportContract';
import { CanonicalIdentityService } from './CanonicalIdentityService';
import { ProductResolverService } from './ProductResolverService';
import { SpecialtyClassifierService } from './SpecialtyClassifierService';

export type RowPreflightStatus = 'READY' | 'WARNING' | 'ERROR' | 'REVIEW_REQUIRED';

export interface RowPreflightResult {
  index: number;
  originalData: Record<string, any>;
  parsedData: Partial<CanonicalImportRow> & {
    externalPersonId?: number;
    specialty?: string;
    enrollmentStatus?: string;
    sellerContract?: string;
  } | null;
  status: RowPreflightStatus;
  errors: string[];
  warnings: string[];
  identityStatus: 'FOUND' | 'NOT_FOUND' | 'AMBIGUOUS' | 'NOT_REQUIRED';
  personId?: string;
  catalogStatus: 'FOUND' | 'UNKNOWN' | 'NOT_REQUIRED';
  resolvedProductId?: string;
  resolvedProductName?: string;
  classifiedSpecialty?: string;
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

  private static getField(row: any, ...fieldNames: string[]): string | undefined {
    for (const fn of fieldNames) {
      const foundKey = Object.keys(row).find(k => k.trim().toLowerCase() === fn.trim().toLowerCase());
      if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
        const val = row[foundKey].toString().trim();
        if (val) return val;
      }
    }
    return undefined;
  }

  private static async analyzeRow(rawRow: any, index: number): Promise<RowPreflightResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let status: RowPreflightStatus = 'READY';

    // 1. Extração Inteligente de Nome e ID Legado (ex: "944472/FRANCIELI RIBEIRO DE BRITO")
    const clientField = this.getField(rawRow, 'Cliente', 'cliente', 'Aluno', 'aluno');
    let name = this.getField(rawRow, 'name', 'nome', 'full_name', 'fullName');
    let externalPersonIdStr = this.getField(rawRow, 'id', 'externalPersonId', 'codigo', 'Código');

    if (clientField && clientField.includes('/')) {
      const parts = clientField.split('/');
      if (parts[0] && !isNaN(Number(parts[0].trim()))) {
        externalPersonIdStr = parts[0].trim();
      }
      name = parts.slice(1).join('/').trim();
    } else if (clientField && !name) {
      name = clientField;
    }

    const externalPersonId = externalPersonIdStr && !isNaN(Number(externalPersonIdStr))
      ? Number(externalPersonIdStr)
      : undefined;

    // 2. Extração de E-mail (Fiscal, Pessoal ou Canônico)
    let email = this.getField(rawRow, 'email', 'EMAIL', 'EMAIL_FISCAL', 'Email', 'E-mail');
    if (email && email.includes(';')) {
      email = email.split(';')[0].trim();
    }
    if (email && !email.includes('@')) {
      email = undefined; // Limpa e-mails corrompidos
    }

    // 3. Extração e Sanitização de Telefone
    let phone = this.getField(rawRow, 'phone', 'telefone', 'Telefone Comercial', 'Telefone Residencial', 'whatsapp', 'Celular');
    if (phone) {
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 8 || /^0+$/.test(digits) || digits === '55555555555') {
        phone = undefined; // Ignora padrões zerados ou nulos de ERP como (00)00000-0000
      }
    }

    // 4. Mapeamento de Produto / Curso / Cód.Curso
    let productName = this.getField(rawRow, 'product_name', 'produto', 'Curso', 'curso', 'Descrição', 'Descricao');
    const productId = this.getField(rawRow, 'product_id', 'Cód.Curso', 'Cod.Curso', 'codigo_curso', 'cod_curso');

    if (productName && productName.toUpperCase().startsWith('CURSOS /')) {
      productName = productName.replace(/^CURSOS\s*\/\s*/i, '').trim();
    }

    // 5. Mapeamento de Status da Matrícula (ex: 24/ATIVA -> ACTIVE, 37/CANCELADO -> CANCELED)
    const rawStatus = this.getField(rawRow, 'Status', 'status', 'situacao', 'Situação');
    let enrollmentStatus = 'ACTIVE';
    if (rawStatus) {
      const up = rawStatus.toUpperCase();
      if (up.includes('CANCEL') || up.includes('37/')) enrollmentStatus = 'CANCELED';
      else if (up.includes('DESIST') || up.includes('47/')) enrollmentStatus = 'CANCELED';
      else if (up.includes('ATIVA') || up.includes('24/')) enrollmentStatus = 'ACTIVE';
      else if (up.includes('CONCLU') || up.includes('FINAL')) enrollmentStatus = 'COMPLETED';
    }

    // 6. Mapeamento de Vendedor
    const sellerContract = this.getField(rawRow, 'Vendedor Contrato', 'Vendedor Cliente', 'vendedor', 'seller');

    // 7. Tipo de Fato (PURCHASE vs OPPORTUNITY)
    let factTypeStr = this.getField(rawRow, 'fact_type', 'tipo_fato')?.toUpperCase();
    if (!factTypeStr) {
      if (rawStatus || productId || productName) {
        factTypeStr = 'PURCHASE';
      } else {
        factTypeStr = 'OPPORTUNITY';
      }
    }
    const factType = factTypeStr as ImportFactType;

    // 8. Valor Financeiro
    const valueStr = this.getField(rawRow, 'value', 'valor', 'preco', 'price');
    let value: number | undefined = undefined;
    if (valueStr) {
      const parsedValue = parseFloat(valueStr.replace(',', '.'));
      if (!isNaN(parsedValue)) {
        value = parsedValue;
      }
    }

    // 9. Classificação Inteligente de Especialidade
    const classifiedSpecialty = SpecialtyClassifierService.resolveSpecialty({
      code: productId,
      text: productName || clientField
    });

    // 10. Validação de Identidade Canônica V4
    let identityStatus: 'FOUND' | 'NOT_FOUND' | 'AMBIGUOUS' | 'NOT_REQUIRED' = 'NOT_REQUIRED';
    let personId: string | undefined;

    if (!email && !phone && !externalPersonId) {
      errors.push('E-mail, Telefone ou ID do Cliente são obrigatórios para resolução de identidade.');
      status = 'ERROR';
    } else {
      const identityRes = await CanonicalIdentityService.inspect({
        source: this.getField(rawRow, 'source_label') || 'CSV_IMPORT',
        externalId: externalPersonIdStr || `row_${index}`,
        email,
        phone,
        name
      });
      
      identityStatus = identityRes.status;
      personId = identityRes.personId;

      if (identityStatus === 'AMBIGUOUS') {
        errors.push('Identidade ambígua: Encontrados múltiplos perfis para este contato.');
        status = 'ERROR';
      } else if (identityStatus === 'NOT_FOUND') {
        warnings.push('Nova identidade será criada no banco de dados.');
        if (status === 'READY') status = 'WARNING';
      }
    }

    // 11. Validação de Catálogo de Produtos
    let catalogStatus: 'FOUND' | 'UNKNOWN' | 'NOT_REQUIRED' = 'NOT_REQUIRED';
    let resolvedProductId: string | undefined;
    let resolvedProductName: string | undefined;

    if (factType === 'PURCHASE' || factType === 'SUBSCRIPTION') {
      if (!productName && !productId) {
        errors.push(`Fato do tipo ${factType} exige um produto ou código de curso.`);
        status = 'ERROR';
      } else {
        const catalogRes = await ProductResolverService.resolve(productId || productName);
        catalogStatus = catalogRes.status;
        
        if (catalogStatus === 'FOUND' && 'productId' in catalogRes) {
          resolvedProductId = catalogRes.productId;
          resolvedProductName = catalogRes.productName;
        } else if (catalogStatus === 'UNKNOWN') {
          status = 'REVIEW_REQUIRED';
        }
      }
    }

    return {
      index,
      originalData: rawRow,
      parsedData: {
        name,
        email,
        phone,
        fact_type: factType,
        value,
        product_name: productName,
        product_id: productId,
        externalPersonId,
        specialty: classifiedSpecialty,
        enrollmentStatus,
        sellerContract
      },
      status,
      errors,
      warnings,
      identityStatus,
      personId,
      catalogStatus,
      resolvedProductId,
      resolvedProductName,
      classifiedSpecialty
    };
  }
}

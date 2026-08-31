import { CanonicalImportRow, ImportFactType } from '../domain/ImportContract';
import { CanonicalIdentityService } from './CanonicalIdentityService';
import { ProductResolverService } from './ProductResolverService';
import { SpecialtyClassifierService } from './SpecialtyClassifierService';
import { CsvColumnMapping, CsvSchemaMappingService } from './CsvSchemaMappingService';

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
  static async analyzeCsv(csvContent: string, mapping?: CsvColumnMapping): Promise<PreflightSummary> {
    const parsed = CsvSchemaMappingService.parse(csvContent);
    const rows = mapping
      ? CsvSchemaMappingService.applyMapping(parsed.rows, mapping)
      : parsed.rows;
    return this.analyzeRows(rows);
  }

  private static async analyzeRows(rows: any[]): Promise<PreflightSummary> {
    // Consultas de identidade e catálogo são I/O. Processar tudo em série faz
    // arquivos grandes levarem minutos; o lote limitado evita saturar o Postgres.
    const results: RowPreflightResult[] = new Array(rows.length);
    const concurrency = Math.min(12, Math.max(1, rows.length));
    let cursor = 0;

    const workers = Array.from({ length: concurrency }, async () => {
      while (true) {
        const index = cursor++;
        if (index >= rows.length) return;
        results[index] = await this.analyzeRow(rows[index], index);
      }
    });
    await Promise.all(workers);

    let readyRows = 0;
    let warningRows = 0;
    let errorRows = 0;
    let reviewRows = 0;
    for (const result of results) {
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
    if (!row || typeof row !== 'object') return undefined;
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

    // 1. Extração Inteligente de Nome e ID Legado (ex: "944472/FRANCIELI RIBEIRO DE BRITO" ou "946176/IMPLAMED...")
    const clientField = this.getField(rawRow, 'Cliente', 'cliente', 'Aluno', 'aluno');
    let name = this.getField(rawRow, 'name', 'nome', 'full_name', 'fullName');
    let externalPersonIdStr = this.getField(rawRow, 'externalPersonId', 'external_id');
    const sourceRecordId = this.getField(rawRow, 'source_record_id', 'Código', 'Codigo');

    if (clientField && clientField.includes('/')) {
      const parts = clientField.split('/');
      if (parts[0] && !isNaN(Number(parts[0].trim()))) {
        externalPersonIdStr = parts[0].trim();
      }
      name = parts.slice(1).join('/').trim();
    } else if (clientField && !name) {
      name = clientField;
    } else if (!clientField && name?.includes('/')) {
      const parts = name.split('/');
      if (parts[0] && !isNaN(Number(parts[0].trim()))) {
        externalPersonIdStr = externalPersonIdStr || parts[0].trim();
        name = parts.slice(1).join('/').trim();
      }
    }

    const externalPersonId = externalPersonIdStr && !isNaN(Number(externalPersonIdStr))
      ? Number(externalPersonIdStr)
      : undefined;

    // Data Cadastro representa a data da matrícula/compra no ERP legado.
    const occurredAt = this.parseLegacyDate(
      this.getField(rawRow, 'occurred_at', 'Data Cadastro', 'Data da Compra', 'Data Compra')
    );

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
    let productName = this.getField(rawRow, 'Curso', 'curso', 'product_name', 'produto', 'Descrição', 'Descricao');
    const productId = this.getField(rawRow, 'Cód.Curso', 'Cod.Curso', 'product_id', 'codigo_curso', 'cod_curso');

    if (productName && productName.toUpperCase().startsWith('CURSOS /')) {
      productName = productName.replace(/^CURSOS\s*\/\s*/i, '').trim();
    }
    if (!productName) {
      let desc = this.getField(rawRow, 'Descrição', 'Descricao');
      if (desc && desc.toUpperCase().startsWith('CURSOS /')) {
        desc = desc.replace(/^CURSOS\s*\/\s*/i, '').trim();
      }
      if (desc && desc.toUpperCase() !== 'CURSOS' && desc.toUpperCase() !== 'CURSO') {
        productName = desc;
      }
    }

    // 5. Mapeamento de Status da Matrícula (ex: 24/ATIVA -> ACTIVE, 37/CANCELADO -> CANCELED)
    const rawStatus = this.getField(rawRow, 'fact_status', 'Status', 'status', 'situacao', 'Situação');
    let enrollmentStatus = 'ACTIVE';
    if (rawStatus) {
      const up = rawStatus.toUpperCase();
      if (up.includes('CANCEL') || up.includes('37/')) enrollmentStatus = 'CANCELED';
      else if (up.includes('DESIST') || up.includes('47/')) enrollmentStatus = 'CANCELED';
      else if (up.includes('ATIVA') || up.includes('24/')) enrollmentStatus = 'ACTIVE';
      else if (up.includes('CONCLU') || up.includes('FINAL')) enrollmentStatus = 'COMPLETED';
    }

    // 6. Mapeamento de Vendedor
    const sellerContract = this.getField(rawRow, 'seller', 'Vendedor Contrato', 'Vendedor Cliente', 'vendedor');

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
      const cleanedValue = valueStr.replace(/R\$|\s/g, '').replace(/[^\d,.-]/g, '');
      const lastComma = cleanedValue.lastIndexOf(',');
      const lastDot = cleanedValue.lastIndexOf('.');
      let normalizedValue = cleanedValue;
      if (lastComma > lastDot) {
        normalizedValue = cleanedValue.replace(/\./g, '').replace(',', '.');
      } else if (lastDot > lastComma && lastComma >= 0) {
        normalizedValue = cleanedValue.replace(/,/g, '');
      } else if (lastComma >= 0) {
        normalizedValue = cleanedValue.replace(',', '.');
      }
      const parsedValue = Number(normalizedValue);
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

    if (!email && !phone && !externalPersonId && !name) {
      errors.push('E-mail, Telefone, ID do Cliente ou Nome são obrigatórios para resolução de identidade.');
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
        occurred_at: occurredAt,
        started_at: occurredAt,
        source_record_id: sourceRecordId,
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

  private static parseLegacyDate(value?: string): string | undefined {
    if (!value) return undefined;

    // Exportações do ERP usam M/D/YYYY. Evita interpretação dependente do locale do VPS.
    const legacyMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (legacyMatch) {
      const [, month, day, year] = legacyMatch;
      const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
      if (
        date.getUTCFullYear() === Number(year) &&
        date.getUTCMonth() === Number(month) - 1 &&
        date.getUTCDate() === Number(day)
      ) {
        return date.toISOString();
      }
      return undefined;
    }

    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? undefined : new Date(timestamp).toISOString();
  }
}

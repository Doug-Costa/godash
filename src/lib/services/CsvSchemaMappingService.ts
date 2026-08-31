import Papa from 'papaparse';

export const CSV_CANONICAL_FIELDS = [
  'IGNORE',
  'name',
  'email',
  'phone',
  'external_id',
  'source_record_id',
  'product_id',
  'product_name',
  'fact_status',
  'value',
  'occurred_at',
  'stage',
  'campaign_name',
  'notes',
  'seller'
] as const;

export type CsvCanonicalField = typeof CSV_CANONICAL_FIELDS[number];
export type CsvColumnMapping = Record<string, CsvCanonicalField>;

export interface CsvDetectedColumn {
  header: string;
  samples: string[];
  suggestedTarget: CsvCanonicalField;
  confidence: 'HIGH' | 'MEDIUM' | 'NONE';
  reason: string;
}

export interface CsvSchemaInspection {
  delimiter: string;
  headerRow: number;
  totalColumns: number;
  columns: CsvDetectedColumn[];
  ignoredColumns: number;
  mappedColumns: number;
}

const EXACT_ALIASES: Record<string, CsvCanonicalField> = {
  name: 'name', nome: 'name', cliente: 'name', aluno: 'name', doutor: 'name',
  nomecompleto: 'name', nomedoaluno: 'name', nomedocliente: 'name', nomedodoutor: 'name',
  email: 'email', emailfiscal: 'email', emailprincipal: 'email', emailpessoal: 'email',
  telefone: 'phone', celular: 'phone', whatsapp: 'phone', telefonecomercial: 'phone',
  telefoneresidencial: 'phone', telefoneprincipal: 'phone', mobile: 'phone', phone: 'phone',
  externalid: 'external_id', idcliente: 'external_id', iddocliente: 'external_id',
  idaluno: 'external_id', iddoutor: 'external_id', codigocliente: 'external_id',
  codigomatricula: 'source_record_id', idmatricula: 'source_record_id',
  sourcerecordid: 'source_record_id', codigo: 'source_record_id',
  productid: 'product_id', codcurso: 'product_id', codigocurso: 'product_id',
  curso: 'product_name', produto: 'product_name', nomecurso: 'product_name',
  nomeproduto: 'product_name', descricao: 'product_name',
  status: 'fact_status', situacao: 'fact_status', statusmatricula: 'fact_status',
  situacaomatricula: 'fact_status', factstatus: 'fact_status',
  valor: 'value', valorpago: 'value', preco: 'value', price: 'value', value: 'value',
  datacadastro: 'occurred_at', datacompra: 'occurred_at', datamatricula: 'occurred_at',
  occurredat: 'occurred_at', dataocorrencia: 'occurred_at',
  stage: 'stage', etapa: 'stage', estagio: 'stage',
  campaignname: 'campaign_name', campanha: 'campaign_name',
  notes: 'notes', observacao: 'notes', observacoes: 'notes',
  vendedor: 'seller', vendedorcontrato: 'seller', vendedorcliente: 'seller'
};

export class CsvSchemaMappingService {
  static cleanContent(csvContent: string): { content: string; headerRow: number } {
    const withoutBom = csvContent.replace(/^\uFEFF/, '');
    const lines = withoutBom.split(/\r\n|\n|\r/);
    const headerIndex = lines.findIndex(line => line.replace(/[,;|\t'"\s]/g, '').length > 0);
    const safeHeaderIndex = headerIndex < 0 ? 0 : headerIndex;
    return { content: lines.slice(safeHeaderIndex).join('\n'), headerRow: safeHeaderIndex + 1 };
  }

  static parse(csvContent: string): { rows: Record<string, unknown>[]; fields: string[]; delimiter: string; headerRow: number } {
    const cleaned = this.cleanContent(csvContent);
    const parsed = Papa.parse<Record<string, unknown>>(cleaned.content, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: header => header.trim()
    });

    // PapaParse emite aviso de delimitador para CSVs válidos de uma única coluna.
    const fatalError = parsed.errors.find(error => error.type === 'Quotes');
    if (fatalError) throw new Error(`CSV inválido: ${fatalError.message}`);

    const fields = (parsed.meta.fields || []).filter(field => field.trim().length > 0);
    if (fields.length === 0) throw new Error('Não foi possível identificar o cabeçalho do CSV.');

    const rows = parsed.data.filter(row => Object.values(row).some(value => String(value ?? '').trim().length > 0));
    return { rows, fields, delimiter: parsed.meta.delimiter, headerRow: cleaned.headerRow };
  }

  static inspect(csvContent: string): CsvSchemaInspection {
    const parsed = this.parse(csvContent);
    const columns = parsed.fields.map(header => {
      const suggestion = this.suggest(header);
      const samples = parsed.rows
        .map(row => String(row[header] ?? '').trim())
        .filter(Boolean)
        .slice(0, 3);
      return { header, samples, ...suggestion };
    });

    return {
      delimiter: parsed.delimiter,
      headerRow: parsed.headerRow,
      totalColumns: columns.length,
      columns,
      ignoredColumns: columns.filter(column => column.suggestedTarget === 'IGNORE').length,
      mappedColumns: columns.filter(column => column.suggestedTarget !== 'IGNORE').length
    };
  }

  static applyMapping(rows: Record<string, unknown>[], mapping: CsvColumnMapping): Record<string, unknown>[] {
    const allowed = new Set<string>(CSV_CANONICAL_FIELDS);
    const dateFormats = new Map<string, 'DMY' | 'MDY' | 'ISO'>();
    for (const [source, target] of Object.entries(mapping)) {
      if (target === 'occurred_at') {
        dateFormats.set(source, this.detectDateFormat(rows.map(row => String(row[source] ?? ''))));
      }
    }

    return rows.map(row => {
      const canonical: Record<string, unknown> = {};
      for (const [source, target] of Object.entries(mapping)) {
        if (!allowed.has(target) || target === 'IGNORE') continue;
        let value = row[source];
        if (value === undefined || value === null || String(value).trim() === '') continue;
        if (target === 'occurred_at') value = this.normalizeDate(String(value), dateFormats.get(source) || 'DMY');
        if (canonical[target] === undefined || String(canonical[target]).trim() === '') canonical[target] = value;
      }
      return canonical;
    });
  }

  private static suggest(header: string): Pick<CsvDetectedColumn, 'suggestedTarget' | 'confidence' | 'reason'> {
    const normalized = this.normalizeHeader(header);
    const exact = EXACT_ALIASES[normalized];
    if (exact) {
      return { suggestedTarget: exact, confidence: 'HIGH', reason: 'Cabeçalho reconhecido pelo dicionário canônico.' };
    }

    // IDs genéricos, fiscais, CNPJ/CPF e campos numerados são deliberadamente
    // ignorados. A decisão exige um humano para evitar poluir ou cruzar identidades.
    if (/^(id\d*|codigo\d*)$/.test(normalized) || /(cnpj|cpf|fiscal|clinica|empresa)/.test(normalized)) {
      return { suggestedTarget: 'IGNORE', confidence: 'NONE', reason: 'Campo sensível ou ambíguo; requer mapeamento manual.' };
    }

    return { suggestedTarget: 'IGNORE', confidence: 'NONE', reason: 'Coluna desconhecida; será ignorada e não criará dados.' };
  }

  private static normalizeHeader(header: string): string {
    return header.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  }

  private static detectDateFormat(values: string[]): 'DMY' | 'MDY' | 'ISO' {
    if (values.some(value => /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(value.trim()))) return 'ISO';
    for (const value of values) {
      const match = value.trim().match(/^(\d{1,2})[\/-](\d{1,2})[\/-]\d{4}$/);
      if (!match) continue;
      if (Number(match[1]) > 12) return 'DMY';
      if (Number(match[2]) > 12) return 'MDY';
    }
    // Em arquivos brasileiros ambíguos, o padrão conservador é dia/mês.
    return 'DMY';
  }

  private static normalizeDate(value: string, format: 'DMY' | 'MDY' | 'ISO'): string {
    const trimmed = value.trim();
    if (format === 'ISO') {
      const timestamp = Date.parse(trimmed);
      return Number.isNaN(timestamp) ? trimmed : new Date(timestamp).toISOString();
    }
    const match = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if (!match) return trimmed;
    const first = Number(match[1]);
    const second = Number(match[2]);
    const year = Number(match[3]);
    const month = format === 'MDY' ? first : second;
    const day = format === 'MDY' ? second : first;
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
      ? date.toISOString()
      : trimmed;
  }
}

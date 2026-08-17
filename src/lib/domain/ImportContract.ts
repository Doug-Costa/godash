export enum ImportFactType {
  LEAD_CAPTURE = 'LEAD_CAPTURE',
  OPPORTUNITY = 'OPPORTUNITY',
  PURCHASE = 'PURCHASE',
  SUBSCRIPTION = 'SUBSCRIPTION'
}

export interface CanonicalImportRow {
  // Versão do schema (para garantir evolução segura)
  schema_version: string;
  
  // Identidade (Person)
  name?: string;
  email?: string;
  phone?: string;
  document?: string;
  external_id?: string;
  
  // Catálogo (Product)
  product_id?: string;
  product_name?: string;
  
  // Fato e Estado Comercial
  fact_type: ImportFactType | string;
  fact_status?: string; // e.g. "OPEN", "WON", "COMPLETED", "ACTIVE"
  
  // Finanças
  value?: number;
  currency?: string; // e.g. "BRL"
  
  // Linha do tempo
  occurred_at?: string; // ISO date string
  started_at?: string;  // ISO date string (útil para assinatura ou produto)
  ended_at?: string;    // ISO date string
  
  // Metadata Comercial / Marketing
  campaign_name?: string;
  stage?: string;
  notes?: string;
  
  // Auditoria
  source_label?: string; // De onde veio a planilha (opcional)
  source_record_id?: string; // ID único da origem para idempotência
}

/**
 * Definição das colunas recomendadas para o template Canônico (completo)
 */
export const CANONICAL_CSV_COLUMNS = [
  'schema_version',
  'name',
  'email',
  'phone',
  'document',
  'external_id',
  'product_id',
  'product_name',
  'fact_type',
  'fact_status',
  'value',
  'currency',
  'occurred_at',
  'started_at',
  'ended_at',
  'campaign_name',
  'stage',
  'notes',
  'source_label',
  'source_record_id'
];

/**
 * Definição das colunas recomendadas para o template de Marketing (simplificado)
 */
export const MARKETING_CSV_COLUMNS = [
  'name',
  'email',
  'phone',
  'product_name',
  'fact_type',
  'fact_status',
  'campaign_name',
  'occurred_at',
  'notes'
];

/**
 * ImportNormalizationService
 * Responsável por garantir que os dados importados (especialmente os do catálogo)
 * passem por uma normalização forte e previsível.
 */
export class ImportNormalizationService {
  /**
   * Normaliza uma string de produto ou termo de busca para armazenamento/comparação
   * Regras:
   * 1. Trim (remove espaços do início e fim)
   * 2. Lowercase
   * 3. Remove acentos (diacríticos)
   * 4. Remove múltiplos espaços internos
   */
  static normalizeString(value?: string | null): string | null {
    if (!value) return null;

    let normalized = value.trim().toLowerCase();

    // Remove acentos/diacríticos
    normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Converte múltiplos espaços em um único espaço
    normalized = normalized.replace(/\s+/g, ' ');

    return normalized === '' ? null : normalized;
  }

  /**
   * Extrai e limpa a lista de produtos de um campo (separado por ;)
   */
  static parseProductList(value?: string | null): string[] {
    if (!value) return [];
    
    return value
      .split(';')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }
}

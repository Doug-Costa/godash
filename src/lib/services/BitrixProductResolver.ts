import { BitrixRawDealRow, BitrixProductMapRule } from '@/lib/domain/BitrixImportContract';

export interface ProductResolutionResult {
  level: 'CONFIRMED_PRODUCT' | 'INTEREST_TAG' | 'LEGACY_TITLE';
  productId?: string;
  interestTags: string[];
  legacyDealTitle: string;
}

export class BitrixProductResolver {
  /**
   * Resolução de produtos em 3 Níveis sem poluir o catálogo com produtos falsos:
   * Nível 1: Produto oficial confirmado (por FormId ou padrão inequívoco)
   * Nível 2: Área de Interesse / Especialidade (convertida em tags)
   * Nível 3: Título legado mantido para histórico
   */
  static resolve(
    deal: BitrixRawDealRow,
    rules: BitrixProductMapRule[] = []
  ): ProductResolutionResult {
    const rawTitle = deal.title || 'Negócio sem título';
    const rawFormId = deal.formId?.trim();
    const rawInterest = deal.interestArea?.trim();

    // 1. Nível 1: Buscar mapeamento inequívoco de FormId ou Pattern de Título
    if (rawFormId) {
      const matchForm = rules.find(r => r.bitrixFormId && r.bitrixFormId === rawFormId);
      if (matchForm) {
        return {
          level: 'CONFIRMED_PRODUCT',
          productId: matchForm.crmProductId,
          interestTags: [],
          legacyDealTitle: rawTitle
        };
      }
    }

    if (rawTitle) {
      const matchTitle = rules.find(r => r.bitrixTitlePattern && rawTitle.toLowerCase().includes(r.bitrixTitlePattern.toLowerCase()));
      if (matchTitle) {
        return {
          level: 'CONFIRMED_PRODUCT',
          productId: matchTitle.crmProductId,
          interestTags: [],
          legacyDealTitle: rawTitle
        };
      }
    }

    // 2. Nível 2: Extrair tags de área de interesse se houver
    if (rawInterest) {
      const tags = rawInterest
        .split(/[;,|/]/)
        .map(t => t.trim())
        .filter(t => t.length > 1);

      if (tags.length > 0) {
        return {
          level: 'INTEREST_TAG',
          productId: undefined,
          interestTags: tags,
          legacyDealTitle: rawTitle
        };
      }
    }

    // 3. Nível 3: Fallback seguro sem criar produto lixo
    return {
      level: 'LEGACY_TITLE',
      productId: undefined,
      interestTags: [],
      legacyDealTitle: rawTitle
    };
  }
}

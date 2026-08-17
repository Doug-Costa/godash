import prisma from '@/lib/prisma';
import { ImportNormalizationService } from './ImportNormalizationService';

export type ProductResolutionResult = 
  | { status: 'FOUND'; productId: string; productName: string }
  | { status: 'UNKNOWN'; rawValue: string };

/**
 * ProductResolverService
 * Responsável por tentar resolver uma string de produto do CSV
 * contra o catálogo oficial do banco de dados, utilizando os ProductAliases.
 */
export class ProductResolverService {
  /**
   * Tenta encontrar o produto canônico a partir de uma string recebida.
   * Não altera o banco de dados.
   */
  static async resolve(rawValue?: string | null): Promise<ProductResolutionResult> {
    if (!rawValue) {
      return { status: 'UNKNOWN', rawValue: '' };
    }

    const normalized = ImportNormalizationService.normalizeString(rawValue);
    if (!normalized) {
      return { status: 'UNKNOWN', rawValue };
    }

    // 1. Tentar Match Exato por ID (caso o CSV traga IDs em vez de nomes)
    const exactIdMatch = await prisma.product.findUnique({
      where: { id: rawValue },
      select: { id: true, name: true }
    });
    if (exactIdMatch) {
      return { status: 'FOUND', productId: exactIdMatch.id, productName: exactIdMatch.name };
    }

    // 2. Tentar Match Exato por Nome (ignorando case/acentos na query do banco seria complexo, 
    // mas vamos buscar todos os produtos ativos e fazer match em memória se forem poucos, 
    // ou buscar no Alias)
    
    // Para otimização, primeiro buscamos na tabela de Aliases, pois 
    // o Human-in-the-loop vai popular essa tabela com o nome exato já normalizado.
    const aliasMatch = await prisma.productAlias.findUnique({
      where: { normalizedValue: normalized },
      include: { product: { select: { id: true, name: true } } }
    });

    if (aliasMatch) {
      return { status: 'FOUND', productId: aliasMatch.product.id, productName: aliasMatch.product.name };
    }

    // 3. Fallback: buscar produtos cujo nome contenha o valor (opcional, pode gerar falsos positivos)
    // Para a v4, seremos estritos: se não tá no alias e não é ID, é UNKNOWN e vai pro HITL.
    
    return { status: 'UNKNOWN', rawValue };
  }
}

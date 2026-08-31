import prisma from '@/lib/prisma';
import { ImportNormalizationService } from './ImportNormalizationService';

export type ProductResolutionResult = 
  | { status: 'FOUND'; productId: string; productName: string }
  | { status: 'UNKNOWN'; rawValue: string };

/**
 * ProductResolverService
 * Responsável por tentar resolver uma string de produto do CSV
 * contra o catálogo oficial do banco de dados, utilizando os ProductAliases e busca flexível.
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

    const trimmed = rawValue.trim();
    if (!trimmed) {
      return { status: 'UNKNOWN', rawValue: '' };
    }

    // 1. Tentar Match Exato por ID
    const exactIdMatch = await prisma.product.findUnique({
      where: { id: trimmed },
      select: { id: true, name: true }
    });
    if (exactIdMatch) {
      return { status: 'FOUND', productId: exactIdMatch.id, productName: exactIdMatch.name };
    }

    // Se for código de curso (ex: "90" ou 90), buscar por id "course_90"
    if (!isNaN(Number(trimmed))) {
      const courseIdMatch = await prisma.product.findUnique({
        where: { id: `course_${trimmed}` },
        select: { id: true, name: true }
      });
      if (courseIdMatch) {
        return { status: 'FOUND', productId: courseIdMatch.id, productName: courseIdMatch.name };
      }
    }

    // 2. Normalizações (com espaço e compacta)
    const normalized = ImportNormalizationService.normalizeString(trimmed);
    const compact = trimmed.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

    const OR_conditions: any[] = [];
    if (normalized) OR_conditions.push({ normalizedValue: normalized });
    if (compact && compact !== normalized) OR_conditions.push({ normalizedValue: compact });

    if (OR_conditions.length > 0) {
      const aliasMatch = await prisma.productAlias.findFirst({
        where: { OR: OR_conditions },
        include: { product: { select: { id: true, name: true } } }
      });

      if (aliasMatch) {
        return { status: 'FOUND', productId: aliasMatch.product.id, productName: aliasMatch.product.name };
      }
    }

    // 3. Fallback: Busca flexível no nome do produto
    if (normalized && normalized.length > 3) {
      const products = await prisma.product.findMany({
        where: { isActive: true },
        select: { id: true, name: true }
      });

      for (const p of products) {
        const pNorm = ImportNormalizationService.normalizeString(p.name);
        if (pNorm && (pNorm === normalized || pNorm.includes(normalized) || normalized.includes(pNorm))) {
          return { status: 'FOUND', productId: p.id, productName: p.name };
        }
      }
    }
    
    return { status: 'UNKNOWN', rawValue: trimmed };
  }
}

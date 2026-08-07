import prisma from '../prisma';
import { ProductCategory, ProductSubType, SaleChannel } from '@prisma/client';

export interface SegmentationFilter {
  purchasedProducts?: {
    productId: string;
    status?: string;
    startDateGe?: Date;
    startDateLe?: Date;
  }[];
  notPurchasedProducts?: string[];
  purchasedCategories?: {
    category: ProductCategory;
    subType?: ProductSubType;
    startDateGe?: Date;
  }[];
  pipelineId?: string;
  stage?: string;
  tags?: string[];
}

export class CampaignSegmentationService {
  /**
   * Filtra e retorna a lista de Customers (leads/clientes) com base em regras
   * lógicas complexas cruzando tabelas relacionais do Prisma (some, none).
   */
  async segmentLeads(filter: SegmentationFilter) {
    const whereClause: any = {};

    // 1. Filtros gerais de Pipeline e Estágio
    if (filter.pipelineId) {
      whereClause.pipelineId = filter.pipelineId;
    }
    if (filter.stage) {
      whereClause.stage = filter.stage;
    }

    // 2. Filtros de Tags
    if (filter.tags && filter.tags.length > 0) {
      whereClause.tag = { in: filter.tags };
    }

    const andConditions: any[] = [];

    // 3. Cruzamento "Tem o Produto X" (some)
    if (filter.purchasedProducts && filter.purchasedProducts.length > 0) {
      for (const item of filter.purchasedProducts) {
        const cpCondition: any = {
          productId: item.productId,
        };

        if (item.status) {
          cpCondition.status = item.status;
        }

        if (item.startDateGe || item.startDateLe) {
          const dateCond: any = {};
          if (item.startDateGe) dateCond.gte = item.startDateGe;
          if (item.startDateLe) dateCond.lte = item.startDateLe;
          cpCondition.startDate = dateCond;
        }

        andConditions.push({
          customerProducts: {
            some: cpCondition,
          },
        });
      }
    }

    // 4. Cruzamento "NÃO tem o Produto Y" (none)
    if (filter.notPurchasedProducts && filter.notPurchasedProducts.length > 0) {
      andConditions.push({
        customerProducts: {
          none: {
            productId: { in: filter.notPurchasedProducts },
          },
        },
      });
    }

    // 5. Cruzamento por Categorias ou Subtipos estruturados
    if (filter.purchasedCategories && filter.purchasedCategories.length > 0) {
      for (const item of filter.purchasedCategories) {
        const catCondition: any = {
          product: {
            category: item.category,
          },
        };

        if (item.subType) {
          catCondition.product = {
            category: item.category,
            subType: item.subType
          };
        }

        if (item.startDateGe) {
          catCondition.startDate = { gte: item.startDateGe };
        }

        andConditions.push({
          customerProducts: {
            some: catCondition,
          },
        });
      }
    }

    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
    }

    // Retorna os clientes correspondentes com seus produtos e dados básicos
    return prisma.customer.findMany({
      where: whereClause,
      include: {
        customerProducts: {
          include: {
            product: true,
          },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }
}

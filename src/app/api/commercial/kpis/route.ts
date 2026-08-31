import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 });
    }

    // 1. Buscar todas as aquisições registradas (CustomerProduct) com os dados dos Produtos
    const allCustomerProducts = await prisma.customerProduct.findMany({
      include: {
        product: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 2. Buscar Oportunidades Ganhas
    const wonOpportunities = await prisma.opportunity.findMany({
      where: {
        status: 'WON'
      },
      select: {
        id: true,
        value: true
      }
    });

    // 3. Cálculos de Sumário Executivo
    let totalRevenue = 0;
    let activeProductsCount = 0;
    const totalSalesCount = allCustomerProducts.length;

    const categoryMap: Record<string, { category: string; totalRevenue: number; count: number }> = {
      CURSO: { category: 'CURSO', totalRevenue: 0, count: 0 },
      SAAS: { category: 'SAAS', totalRevenue: 0, count: 0 },
      CONGRESSO: { category: 'CONGRESSO', totalRevenue: 0, count: 0 },
      LIVRO: { category: 'LIVRO', totalRevenue: 0, count: 0 },
      INSTITUCIONAL: { category: 'INSTITUCIONAL', totalRevenue: 0, count: 0 },
    };

    const productMap: Record<string, {
      id: string;
      name: string;
      category: string;
      subType: string;
      unitsSold: number;
      totalRevenue: number;
      basePrice: number | null;
      isActive: boolean;
    }> = {};

    const channelMap: Record<string, { channel: string; totalRevenue: number; count: number }> = {};
    const monthlyMap: Record<string, { month: string; revenue: number; salesCount: number }> = {};

    for (const cp of allCustomerProducts) {
      const price = cp.pricePaid || 0;
      totalRevenue += price;

      if (cp.status === 'ACTIVE') {
        activeProductsCount++;
      }

      // Categoria
      const cat = cp.product?.category || 'OUTROS';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { category: cat, totalRevenue: 0, count: 0 };
      }
      categoryMap[cat].totalRevenue += price;
      categoryMap[cat].count += 1;

      // Produto
      const prodId = cp.productId;
      const prodName = cp.product?.name || 'Produto Não Identificado';
      if (!productMap[prodId]) {
        productMap[prodId] = {
          id: prodId,
          name: prodName,
          category: cp.product?.category || 'OUTROS',
          subType: cp.product?.subType || 'OUTROS',
          unitsSold: 0,
          totalRevenue: 0,
          basePrice: cp.product?.basePrice ?? cp.product?.price ?? null,
          isActive: cp.product?.isActive ?? true
        };
      }
      productMap[prodId].unitsSold += 1;
      productMap[prodId].totalRevenue += price;

      // Canal
      const ch = cp.saleChannel || 'OUTROS';
      if (!channelMap[ch]) {
        channelMap[ch] = { channel: ch, totalRevenue: 0, count: 0 };
      }
      channelMap[ch].totalRevenue += price;
      channelMap[ch].count += 1;

      // Tendência Mensal
      const dateObj = cp.startDate || cp.createdAt;
      const monthKey = new Date(dateObj).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthKey, revenue: 0, salesCount: 0 };
      }
      monthlyMap[monthKey].revenue += price;
      monthlyMap[monthKey].salesCount += 1;
    }

    // Calcular percentuais por categoria
    const categoryDistribution = Object.values(categoryMap).map(c => ({
      ...c,
      percentage: totalRevenue > 0 ? (c.totalRevenue / totalRevenue) * 100 : 0
    }));

    // Curva ABC de Produtos (ordenados por maior receita)
    const topProducts = Object.values(productMap)
      .map(p => ({
        ...p,
        avgPrice: p.unitsSold > 0 ? p.totalRevenue / p.unitsSold : 0
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Oportunidades Ganhas
    const wonOpportunitiesCount = wonOpportunities.length;
    const wonOpportunitiesValue = wonOpportunities.reduce((acc, opp) => acc + (opp.value || 0), 0);

    const averageTicket = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;

    const monthlyTrend = Object.values(monthlyMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          activeProductsCount,
          totalSalesCount,
          averageTicket,
          wonOpportunitiesCount,
          wonOpportunitiesValue,
        },
        categoryDistribution,
        topProducts,
        channelsDistribution: Object.values(channelMap),
        monthlyTrend
      }
    });

  } catch (error: any) {
    console.error('[Commercial KPIs API Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

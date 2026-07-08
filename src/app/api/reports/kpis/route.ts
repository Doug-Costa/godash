import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return new Response('Unauthorized', { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId') || undefined;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    const dateFilter = startDateStr || endDateStr ? {
      createdAt: {
        ...(startDateStr && { gte: new Date(startDateStr) }),
        ...(endDateStr && { lte: new Date(endDateStr) })
      }
    } : {};

    // 1. Métricas Gerais da Campanha
    const totalLeads = await prisma.leadState.count({
      where: {
        ...(campaignId && { campaignId }),
        ...dateFilter
      }
    });

    const convertedLeads = await prisma.leadState.count({
      where: {
        ...(campaignId && { campaignId }),
        stage: 'ganho',
        ...dateFilter
      }
    });

    const lostLeads = await prisma.leadState.count({
      where: {
        ...(campaignId && { campaignId }),
        stage: 'perdido',
        ...dateFilter
      }
    });

    const attendedLeads = await prisma.leadState.count({
      where: {
        ...(campaignId && { campaignId }),
        interactionCount: { gt: 0 },
        ...dateFilter
      }
    });

    const winRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    // 2. Distribuição de Motivos de Perda
    const lossReasonsGroup = await prisma.leadState.groupBy({
      by: ['lostReason'],
      where: {
        ...(campaignId && { campaignId }),
        stage: 'perdido',
        lostReason: { not: null },
        ...dateFilter
      },
      _count: {
        id: true
      }
    });

    const lostReasonsDistribution = lossReasonsGroup.map(g => ({
      reason: g.lostReason || 'Não informado',
      count: g._count.id
    }));

    // 3. Conversões por Operador (User Ranking)
    const userConversions = await prisma.leadState.groupBy({
      by: ['assigneeId'],
      where: {
        ...(campaignId && { campaignId }),
        stage: 'ganho',
        assigneeId: { not: null },
        ...dateFilter
      },
      _count: {
        id: true
      }
    });

    // Buscar nomes dos usuários para mapear
    const users = await prisma.user.findMany({
      select: { id: true, name: true }
    });
    const userMap = new Map(users.map(u => [u.id, u.name || 'Agente']));

    const userRanking = userConversions.map(uc => ({
      userId: uc.assigneeId,
      userName: userMap.get(uc.assigneeId!) || 'Operador',
      conversions: uc._count.id
    })).sort((a, b) => b.conversions - a.conversions);

    // 4. SLA e Tempo de Resposta Geral e por Operador
    const leadsWithInteraction = await prisma.leadState.findMany({
      where: {
        ...(campaignId && { campaignId }),
        assigneeId: { not: null },
        lastInteractionAt: { not: null },
        ...dateFilter
      },
      select: {
        assigneeId: true,
        createdAt: true,
        lastInteractionAt: true
      }
    });

    let globalAvgSlaHours = 0;
    const userSlaMap: Record<string, { totalMs: number; count: number }> = {};

    if (leadsWithInteraction.length > 0) {
      let totalMs = 0;
      leadsWithInteraction.forEach(lead => {
        const ms = lead.lastInteractionAt!.getTime() - lead.createdAt.getTime();
        totalMs += ms;

        if (lead.assigneeId) {
          if (!userSlaMap[lead.assigneeId]) {
            userSlaMap[lead.assigneeId] = { totalMs: 0, count: 0 };
          }
          userSlaMap[lead.assigneeId].totalMs += ms;
          userSlaMap[lead.assigneeId].count += 1;
        }
      });
      globalAvgSlaHours = (totalMs / leadsWithInteraction.length) / (1000 * 60 * 60);
    }

    const userSlaList = Object.entries(userSlaMap).map(([userId, stats]) => ({
      userId,
      userName: userMap.get(userId) || 'Operador',
      avgSlaHours: (stats.totalMs / stats.count) / (1000 * 60 * 60),
      count: stats.count
    })).sort((a, b) => a.avgSlaHours - b.avgSlaHours); // Menor tempo de resposta primeiro

    // 5. Totalizador de Campanhas ativas
    const activeCampaignsCount = await prisma.campaign.count({
      where: { status: 'ACTIVE' }
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalLeads,
          attendedLeads,
          convertedLeads,
          lostLeads,
          winRate,
          globalAvgSlaHours,
          activeCampaignsCount
        },
        lostReasonsDistribution,
        userRanking,
        userSlaRanking: userSlaList
      }
    });

  } catch (error: any) {
    console.error('GET kpis error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

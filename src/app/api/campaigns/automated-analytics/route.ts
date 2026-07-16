import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      return NextResponse.json({ success: false, error: 'campaignId é obrigatório' }, { status: 400 });
    }

    // 1. Get campaign metadata
    const campaign = await prisma.journey.findUnique({
      where: { id: campaignId },
      include: {
        _count: {
          select: { customers: true }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campanha não encontrada' }, { status: 404 });
    }

    // 2. Load all customers inside this campaign
    const totalLeads = campaign._count.customers;

    // 3. Load interactions related to these customers
    const interactions = await prisma.interaction.findMany({
      where: {
        customer: {
          journeyId: campaignId
        }
      },
      include: {
        customer: {
          select: {
            metadata: true
          }
        }
      }
    });

    const sent = interactions.filter(i => ['SENT', 'DELIVERED', 'READ'].includes(i.deliveryStatus)).length;
    const delivered = interactions.filter(i => ['DELIVERED', 'READ'].includes(i.deliveryStatus)).length;
    const read = interactions.filter(i => i.deliveryStatus === 'READ').length;
    const failedLogs = interactions
      .filter(i => i.deliveryStatus === 'FAILED')
      .map(i => ({
        id: i.id,
        leadName: (i.customer?.metadata as any)?.fullName || 'Lead Desconhecido',
        channel: i.channel || 'EMAIL',
        errorMessage: i.errorMessage || 'Erro de conexão/desconhecido',
        createdAt: i.createdAt.toISOString()
      }));

    // Calculate Qualified Leads (leadScore >= 50)
    const qualifiedLeads = await prisma.customer.count({
      where: {
        journeyId: campaignId,
        leadScore: { gte: 50 }
      }
    });

    // 4. Group engagement funnel metrics by step name
    // Let's count how many sent/read interactions happened at each unique step description or text
    const funnelStepsMap: Record<string, { sent: number; read: number }> = {};
    for (const inter of interactions) {
      const stepName = inter.text.split(' - ')[0] || 'Passo do Fluxo';
      if (!funnelStepsMap[stepName]) {
        funnelStepsMap[stepName] = { sent: 0, read: 0 };
      }
      if (['SENT', 'DELIVERED', 'READ'].includes(inter.deliveryStatus)) {
        funnelStepsMap[stepName].sent++;
      }
      if (inter.deliveryStatus === 'READ') {
        funnelStepsMap[stepName].read++;
      }
    }

    const funnelSteps = Object.entries(funnelStepsMap).map(([name, val]) => ({
      name,
      sent: val.sent,
      read: val.read
    }));

    return NextResponse.json({
      success: true,
      data: {
        campaignName: campaign.name,
        status: campaign.status,
        totalLeads,
        metrics: {
          sent,
          delivered,
          deliveryRate: sent > 0 ? (delivered / sent) * 100 : 100,
          read,
          readRate: delivered > 0 ? (read / delivered) * 100 : 0,
          qualifiedLeads
        },
        funnelSteps,
        failedLogs
      }
    });
  } catch (err: any) {
    console.error('Automated analytics error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

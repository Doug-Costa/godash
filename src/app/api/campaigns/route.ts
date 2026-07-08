import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { AssignCampaignLeadsUseCase } from '@/lib/application/AssignCampaignLeadsUseCase';

export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return new Response('Unauthorized', { status: 403 });
    }

    const campaigns = await prisma.campaign.findMany({
      include: {
        flowSteps: {
          orderBy: { dayOffset: 'asc' }
        },
        _count: {
          select: { leads: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: campaigns });
  } catch (error: any) {
    console.error('GET campaigns error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return new Response('Unauthorized', { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    // 1. Ação de Atribuição (Round Robin)
    if (action === 'assign') {
      const { campaignId, externalPersonIds, userIds } = body;
      if (!campaignId || !externalPersonIds || !userIds || !Array.isArray(externalPersonIds) || !Array.isArray(userIds)) {
        return NextResponse.json({ success: false, error: 'Parâmetros inválidos para atribuição' }, { status: 400 });
      }

      const useCase = new AssignCampaignLeadsUseCase();
      const results = await useCase.execute(externalPersonIds, campaignId, userIds);

      return NextResponse.json({ success: true, count: results.length, data: results });
    }

    // 2. Ação padrão: Criar Campanha e Réguas (FlowSteps)
    const { name, status, flowSteps } = body;
    if (!name) {
      return NextResponse.json({ success: false, error: 'Nome da campanha é obrigatório' }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        status: status || 'ACTIVE',
        flowSteps: flowSteps && Array.isArray(flowSteps) ? {
          create: flowSteps.map((step: any) => ({
            dayOffset: Number(step.dayOffset),
            channel: step.channel, // "WHATSAPP", "EMAIL", "CALL"
            messageTemplate: step.messageTemplate
          }))
        } : undefined
      },
      include: {
        flowSteps: true
      }
    });

    return NextResponse.json({ success: true, data: campaign });
  } catch (error: any) {
    console.error('POST campaigns error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

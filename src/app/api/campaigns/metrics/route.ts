import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return new Response('Unauthorized', { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const journeyId = searchParams.get('journeyId');

    if (!journeyId) {
      // Return overall metrics summary if no specific journey ID requested
      const journeys = await prisma.journey.findMany({
        select: {
          id: true,
          name: true,
          status: true,
          sendingMode: true,
          minDelay: true,
          maxDelay: true,
          totalEmails: true,
          sentEmails: true,
          failedEmails: true,
          openedEmails: true,
          createdAt: true,
          updatedAt: true,
          pipelineId: true,
          automations: {
            select: {
              id: true,
              name: true,
              channel: true,
              delayDays: true,
              provider: true,
            }
          },
          _count: {
            select: { customers: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Also fetch Visual Flows metrics for CampaignMonitorDashboard
      const flows = await prisma.flow.findMany({
        select: {
          id: true,
          name: true,
          status: true,
          steps: {
            select: { id: true, type: true, order: true }
          },
          _count: {
            select: { executions: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Get some execution aggregates if needed
      const flowExecutions = await prisma.flowExecution.groupBy({
        by: ['flowId', 'status'],
        _count: { id: true }
      });

      return NextResponse.json({ success: true, data: journeys, flows, flowExecutions });
    }

    // Specific journey metrics detail
    const journey = await prisma.journey.findUnique({
      where: { id: journeyId },
      include: {
        automations: {
          orderBy: { stepNumber: 'asc' }
        },
        _count: {
          select: { customers: true }
        }
      }
    });

    if (!journey) {
      return NextResponse.json({ success: false, error: 'Jornada não encontrada' }, { status: 404 });
    }

    // Fetch recipient dispatch logs for this journey
    const recipientLogs = await prisma.recipientLog.findMany({
      where: { journeyId },
      take: 100,
      orderBy: { createdAt: 'desc' }
    });

    // Se for um Flow disfarçado de Journey ou se a UI enviar o flowId aqui, retornamos a flowExecution.
    // Para simplificar, vou permitir buscar flow metrics passando flowId no futuro, 
    // mas por hora mantemos a retrocompatibilidade.

    return NextResponse.json({
      success: true,
      data: {
        journey,
        recipientLogs
      }
    });
  } catch (error: any) {
    console.error('GET /api/campaigns/metrics error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

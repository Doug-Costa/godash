import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { JourneyTransitionService } from '@/lib/services/JourneyTransitionService';

export async function POST(request: Request) {
  try {
    // 1. Authenticate and check Admin role
    const session = await auth();
    if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas administradores podem executar ações em massa.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, targetAssigneeId, filters } = body;

    if (!action || !['assign', 'return_to_queue'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Ação inválida ou não especificada.' },
        { status: 400 }
      );
    }

    if (!filters) {
      return NextResponse.json(
        { success: false, error: 'Filtros de segmentação são obrigatórios.' },
        { status: 400 }
      );
    }

    // 2. Build filters for Postgres query
    const crmFilter: any = {};

    if (filters.pipelineId && filters.pipelineId !== 'all') {
      crmFilter.pipelineId = filters.pipelineId;
    }
    if (filters.assigneeId) {
      if (filters.assigneeId === 'unassigned') {
        crmFilter.assigneeId = null;
      } else if (filters.assigneeId !== 'all') {
        crmFilter.assigneeId = filters.assigneeId;
      }
    }
    if (filters.journeyId) {
      if (filters.journeyId === 'none') {
        crmFilter.journeyId = null;
      } else if (filters.journeyId !== 'all') {
        crmFilter.journeyId = filters.journeyId;
      }
    }
    if (filters.stage && filters.stage !== 'all') {
      crmFilter.stage = filters.stage;
    }

    // Exclude discarded leads to match active Kanban view
    crmFilter.OR = [
      { tag: null },
      { tag: { not: 'DISCARDED' } }
    ];

    let updatedCount = 0;

    // 3. Execute actions based on type
    if (action === 'assign') {
      if (targetAssigneeId === undefined) {
        return NextResponse.json(
          { success: false, error: 'Operador de destino é obrigatório para atribuição.' },
          { status: 400 }
        );
      }

      const assigneeValue = targetAssigneeId === 'unassign' ? null : targetAssigneeId;

      const result = await prisma.customer.updateMany({
        where: crmFilter,
        data: {
          assigneeId: assigneeValue
        }
      });
      updatedCount = result.count;

    } else if (action === 'return_to_queue') {
      // Find all matching customers
      const matchingCustomers = await prisma.customer.findMany({
        where: crmFilter,
        select: {
          id: true,
          externalPersonId: true,
          journeyId: true
        }
      });

      for (const cust of matchingCustomers) {
        // A. Delete pending tasks first
        await prisma.task.deleteMany({
          where: {
            customerId: cust.id,
            status: 'PENDING'
          }
        });

        // B. If lead is in a campaign, merge them back to generic customer
        if (cust.journeyId !== null) {
          const genericCust = await JourneyTransitionService.mergeCustomerToGeneric(
            cust.id,
            cust.externalPersonId,
            'novo_cadastro',
            (session.user as any).id
          );

          // C. Reset values on generic customer record
          if (genericCust) {
            await prisma.customer.update({
              where: { id: genericCust.id },
              data: {
                assigneeId: null,
                isInNurturing: false,
                nurturingJourneyId: null
              }
            });
          }
        } else {
          // D. If they are already generic, just reset their stage and unassign
          await prisma.customer.update({
            where: { id: cust.id },
            data: {
              stage: 'novo_cadastro',
              assigneeId: null,
              isInNurturing: false,
              nurturingJourneyId: null
            }
          });
        }
        updatedCount++;
      }
    }

    return NextResponse.json({ success: true, updatedCount });
  } catch (error: any) {
    console.error('[Bulk Action API Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}

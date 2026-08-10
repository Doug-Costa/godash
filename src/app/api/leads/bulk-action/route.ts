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
    const { action, targetAssigneeId, targetJourneyId, leadIds, filters } = body;

    if (!action || !['assign', 'return_to_queue', 'enrol_campaign'].includes(action)) {
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
    if (action === 'enrol_campaign') {
      if (!targetJourneyId) {
        return NextResponse.json({ success: false, error: 'Jornada de destino é obrigatória.' }, { status: 400 });
      }

      const targetIdsToProcess = Array.isArray(leadIds) && leadIds.length > 0
        ? leadIds.map((id: string) => id.startsWith('ext_') ? parseInt(id.replace('ext_', ''), 10) : id)
        : [];

      if (targetIdsToProcess.length > 0) {
        const { AssignCampaignLeadsUseCase } = await import('@/lib/application/AssignCampaignLeadsUseCase');
        const useCase = new AssignCampaignLeadsUseCase();
        const results = await useCase.execute(targetIdsToProcess, targetJourneyId, []);
        updatedCount = results.length;
      }
    } else if (action === 'assign') {
      if (targetAssigneeId === undefined) {
        return NextResponse.json(
          { success: false, error: 'Operador de destino é obrigatório para atribuição.' },
          { status: 400 }
        );
      }

      const assigneeValue = targetAssigneeId === 'unassign' ? null : targetAssigneeId;

      if (Array.isArray(leadIds) && leadIds.length > 0) {
        const cIds = leadIds.filter((id: string) => !id.startsWith('ext_'));
        const extIds = leadIds.filter((id: string) => id.startsWith('ext_')).map((id: string) => parseInt(id.replace('ext_', ''), 10));

        if (cIds.length > 0) {
          const res = await prisma.customer.updateMany({
            where: { id: { in: cIds } },
            data: { assigneeId: assigneeValue }
          });
          updatedCount += res.count;
        }

        for (const extId of extIds) {
          await prisma.customer.upsert({
            where: { externalPersonId_journeyId: { externalPersonId: extId, journeyId: 'generic' } },
            create: {
              externalPersonId: extId,
              assigneeId: assigneeValue,
              stage: 'novo_cadastro'
            },
            update: {
              assigneeId: assigneeValue
            }
          });
          updatedCount++;
        }
      } else {
        const result = await prisma.customer.updateMany({
          where: crmFilter,
          data: {
            assigneeId: assigneeValue
          }
        });
        updatedCount = result.count;
      }

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

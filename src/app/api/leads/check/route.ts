import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { IdentityResolutionService } from '@/lib/application/IdentityResolutionService';
import { auth } from '@/auth';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone } = body;

    // Resolve Identity
    const resolution = await IdentityResolutionService.resolve({
      email,
      phoneNumber: phone,
      fullName: name
    });

    if (resolution.action === 'FOUND' && resolution.person) {
      const personId = resolution.person.id;

      // Find if there are active opportunities
      const activeOpps = await prisma.opportunity.findMany({
        where: {
          customer: {
            personId
          },
          status: 'OPEN'
        },
        include: {
          pipeline: true,
          customer: {
            include: {
              journey: true
            }
          }
        }
      });

      if (activeOpps.length > 0) {
        // Collect conflicts
        const conflicts = activeOpps.map(opp => {
          return {
            pipelineName: opp.pipeline?.name || 'Funil Desconhecido',
            journeyName: opp.customer?.journey?.name || 'Sem Campanha',
            assigneeId: opp.customer?.assigneeId,
            oppId: opp.id,
            customerId: opp.customerId
          };
        });

        // Resolve assignees names
        const assigneeIds = [...new Set(conflicts.map(c => c.assigneeId).filter(Boolean))] as string[];
        const assignees = await prisma.user.findMany({
          where: { id: { in: assigneeIds } },
          select: { id: true, name: true }
        });
        
        const assigneeMap = Object.fromEntries(assignees.map(a => [a.id, a.name]));

        const formattedConflicts = conflicts.map(c => ({
          ...c,
          assigneeName: c.assigneeId ? assigneeMap[c.assigneeId] || 'Operador Desconhecido' : 'Fila de Distribuição'
        }));

        return NextResponse.json({
          exists: true,
          conflicts: formattedConflicts,
          personName: resolution.person.fullName || name
        });
      }
      
      return NextResponse.json({ exists: false }); // Exists as person but no active opportunities
    }

    return NextResponse.json({ exists: false });

  } catch (error: any) {
    console.error('[Leads Check API] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
}

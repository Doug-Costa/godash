import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { CanonicalIdentityService } from '@/lib/services/CanonicalIdentityService';
import { auth } from '@/auth';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone } = body;

    // Mesma regra das entradas (somente leitura). Antes usava IdentityResolutionService, que
    // nunca respondia 'FOUND' — o aviso de negociação em andamento nunca aparecia.
    const resolution = await CanonicalIdentityService.inspect({
      source: 'MANUAL',
      externalId: 'leads-check',
      email,
      phone,
      name
    });
    const person = resolution.status === 'FOUND' && resolution.personId
      ? await prisma.person.findUnique({ where: { id: resolution.personId }, select: { id: true, fullName: true } })
      : null;

    if (person) {
      const personId = person.id;

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
          personName: person.fullName || name
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

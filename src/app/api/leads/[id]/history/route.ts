import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const externalPersonId = parseInt(id, 10);
    if (isNaN(externalPersonId)) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }

    // Buscar a oportunidade aberta ou mais recente deste customer
    const customer = await prisma.customer.findFirst({
      where: { externalPersonId },
      include: {
        opportunities: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            assignmentHistory: {
              orderBy: { assignedAt: 'desc' },
              include: {
                assignee: {
                  select: { id: true, name: true, email: true, image: true }
                }
              }
            }
          }
        }
      }
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Lead não encontrado' }, { status: 404 });
    }

    const history = customer.opportunities[0]?.assignmentHistory || [];

    return NextResponse.json({ success: true, data: history });
  } catch (error: any) {
    console.error('GET lead history error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

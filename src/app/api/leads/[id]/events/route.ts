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

    const customer = await prisma.customer.findFirst({
      where: { externalPersonId }
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer não encontrado' }, { status: 404 });
    }

    const events = await prisma.domainEvent.findMany({
      where: {
        OR: [
          { personId: customer.personId },
          { customerId: customer.id }
        ]
      },
      orderBy: { occurredAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    console.error('[GET /api/leads/[id]/events] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

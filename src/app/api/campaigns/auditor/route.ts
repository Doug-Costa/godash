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
    const customerId = searchParams.get('customerId');
    const journeyId = searchParams.get('journeyId');

    if (!customerId || !journeyId) {
      return NextResponse.json({ success: false, error: 'Missing customerId or journeyId' }, { status: 400 });
    }

    const journey = await prisma.journey.findUnique({
      where: { id: journeyId },
      include: {
        automations: true
      }
    });

    if (!journey) {
      return NextResponse.json({ success: false, error: 'Journey not found' }, { status: 404 });
    }

    const interactions = await prisma.interaction.findMany({
      where: {
        customerId,
        automationId: { not: null }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, journey, interactions });

  } catch (error: any) {
    console.error('GET auditor error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

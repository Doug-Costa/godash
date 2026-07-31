import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { CrmEventDispatcher } from '@/lib/domain/crm.events';

export async function POST(request: Request) {
  const session = await auth();
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { externalPersonId, journeyId } = await request.json();

    if (!externalPersonId) {
      return NextResponse.json({ error: 'Missing externalPersonId' }, { status: 400 });
    }

    const customer = await prisma.customer.findFirst({
      where: { externalPersonId: Number(externalPersonId), journeyId: journeyId || null }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        humanTakeover: false,
        frozenUntil: null,
        freezeReason: null
      }
    });

    // Record interaction
    await prisma.interaction.create({
      data: {
        customerId: customer.id,
        text: 'O operador retomou a execução da automação (Takeover desfeito).',
        authorId: session.user.id,
        type: 'SYSTEM',
      }
    });

    CrmEventDispatcher.dispatch({
      eventName: 'LeadAutomationResumedEvent',
      externalPersonId: Number(externalPersonId),
      authorId: session.user.id,
      timestamp: new Date()
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Resume Flow error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

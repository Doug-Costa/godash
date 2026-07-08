import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { personId, freezeUntil, reason } = body;

    if (!personId || !freezeUntil || !reason) {
      return NextResponse.json({ success: false, error: 'Parâmetros insuficientes. Informe personId, freezeUntil e reason.' }, { status: 400 });
    }

    const dateToFreeze = new Date(freezeUntil);
    if (isNaN(dateToFreeze.getTime())) {
      return NextResponse.json({ success: false, error: 'Data de congelamento inválida.' }, { status: 400 });
    }

    // Buscar ou criar LeadState
    const leadState = await prisma.leadState.upsert({
      where: { externalPersonId: Number(personId) },
      update: {
        frozenUntil: dateToFreeze,
        freezeReason: reason
      },
      create: {
        externalPersonId: Number(personId),
        stage: 'novo_cadastro',
        frozenUntil: dateToFreeze,
        freezeReason: reason,
        assigneeId: userId // assume se não tiver atribuído
      }
    });

    // Registrar interação
    const formattedDate = dateToFreeze.toLocaleDateString('pt-BR');
    await prisma.leadInteraction.create({
      data: {
        leadStateId: leadState.id,
        authorId: userId,
        text: `Lead congelado até ${formattedDate}. Motivo: ${reason}`
      }
    });

    return NextResponse.json({ success: true, data: leadState });
  } catch (error: any) {
    console.error('POST freeze error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

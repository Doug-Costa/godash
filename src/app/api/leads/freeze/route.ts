import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { CanonicalIdentityService } from '@/lib/services/CanonicalIdentityService';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { personId, journeyId, freezeUntil, reason } = body;

    if (!personId || !freezeUntil || !reason) {
      return NextResponse.json({ success: false, error: 'Parâmetros insuficientes. Informe personId, freezeUntil e reason.' }, { status: 400 });
    }

    const dateToFreeze = new Date(freezeUntil);
    if (isNaN(dateToFreeze.getTime())) {
      return NextResponse.json({ success: false, error: 'Data de congelamento inválida.' }, { status: 400 });
    }

    const resolvedJourneyId = journeyId || null;

    // CDP V4 - Resolver identidade canônica antes de persistir o Customer
    const person = await CanonicalIdentityService.resolve({
      source: 'DENTALGO',
      externalId: String(personId)
    });

    // Buscar ou criar Customer
    let customer = await prisma.customer.findFirst({
      where: { externalPersonId: Number(personId), journeyId: resolvedJourneyId }
    });

    if (customer) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          personId: person.id, // assegura o link
          frozenUntil: dateToFreeze,
          freezeReason: reason
        }
      });
      // Freeze open opportunities
      await prisma.opportunity.updateMany({
        where: { customerId: customer.id, status: 'OPEN' },
        data: { freezeUntil: dateToFreeze }
      });
    } else {
      customer = await prisma.customer.create({
        data: {
          externalPersonId: Number(personId),
          personId: person.id,
          journeyId: resolvedJourneyId,
          stage: 'novo_cadastro',
          frozenUntil: dateToFreeze,
          freezeReason: reason,
          assigneeId: userId // assume se não tiver atribuído
        }
      });
    }

    // Registrar interação
    const formattedDate = dateToFreeze.toLocaleDateString('pt-BR');
    await prisma.interaction.create({
      data: {
        customerId: customer.id,
        authorId: userId,
        text: `Lead congelado até ${formattedDate}. Motivo: ${reason}`
      }
    });

    return NextResponse.json({ success: true, data: customer });
  } catch (error: any) {
    console.error('POST freeze error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

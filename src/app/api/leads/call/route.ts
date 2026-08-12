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
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json({ success: false, error: 'leadId é obrigatório' }, { status: 400 });
    }

    let customer = null;
    const isCuid = typeof leadId === 'string' && !/^\d+$/.test(leadId);

    if (isCuid) {
      customer = await prisma.customer.findUnique({
        where: { id: leadId }
      });
    } else {
      const extId = Number(leadId);
      customer = await prisma.customer.findFirst({
        where: { externalPersonId: extId, journeyId: null }
      });
      if (!customer) {
        // CDP V4 - Resolver identidade canônica antes de persistir o Customer
        const person = await CanonicalIdentityService.resolve({
          source: 'DENTALGO',
          externalId: String(extId)
        });

        customer = await prisma.customer.create({
          data: {
            externalPersonId: extId,
            personId: person.id,
            journeyId: null,
            stage: 'novo_cadastro'
          }
        });
      }
    }

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Lead não encontrado' }, { status: 404 });
    }

    // Busca o telefone do banco de dados MySQL
    const pool = require('@/lib/db').default;
    const [personRows] = await pool.query(
      'SELECT phoneNumber FROM people WHERE id = ? LIMIT 1',
      [customer.externalPersonId]
    );
    const person = (personRows as any[])[0];
    const targetPhone = person?.phoneNumber || 'Sem telefone';

    // Grava interação na timeline simulando o VoIP
    await prisma.interaction.create({
      data: {
        customerId: customer.id,
        authorId: userId,
        text: `📞 [VoIP/Telefone RapidFire] Chamada iniciada para o número: ${targetPhone}.`
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('RapidFire Call API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

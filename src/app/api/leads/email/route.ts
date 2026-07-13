import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { NotificationService } from '@/lib/services/NotificationService';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { leadId, subject, emailBody } = body;

    if (!leadId || !subject || !emailBody) {
      return NextResponse.json({ success: false, error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: leadId }
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Lead não encontrado' }, { status: 404 });
    }

    // Busca o email do banco de dados MySQL para garantir o envio correto
    const pool = require('@/lib/db').default;
    const [personRows] = await pool.query(
      'SELECT email FROM people WHERE id = ? LIMIT 1',
      [customer.externalPersonId]
    );
    const person = (personRows as any[])[0];
    const targetEmail = person?.email || `lead_${customer.externalPersonId}@dentalgo.com`;

    // Dispara a notificação via SMTP
    const emailSuccess = await NotificationService.sendEmail(targetEmail, subject, emailBody);

    // Grava interação na timeline
    await prisma.interaction.create({
      data: {
        customerId: customer.id,
        authorId: userId,
        text: `📧 [E-mail RapidFire] Assunto: "${subject}". Status: ${emailSuccess ? 'Enviado' : 'Falhou'}`
      }
    });

    return NextResponse.json({ success: true, emailSuccess });
  } catch (error: any) {
    console.error('RapidFire Email API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

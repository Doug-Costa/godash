import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 });
    }

    const body = await request.json();
    const { customerId, productId, pricePaid, startDate, validUntil, status, saleChannel } = body;

    if (!customerId || !productId) {
      return NextResponse.json({ success: false, error: 'customerId e productId são obrigatórios.' }, { status: 400 });
    }

    // 1. Verificar se o Customer existe
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Cliente não encontrado.' }, { status: 404 });
    }

    // 2. Criar o registro de CustomerProduct
    const customerProduct = await prisma.customerProduct.create({
      data: {
        customerId,
        productId,
        pricePaid: pricePaid !== undefined && pricePaid !== null ? Number(pricePaid) : null,
        startDate: startDate ? new Date(startDate) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        status: status || 'ACTIVE',
        saleChannel: saleChannel || 'BALCAO_MANUAL',
      },
      include: {
        product: true
      }
    });

    return NextResponse.json({ success: true, data: customerProduct });
  } catch (error: any) {
    console.error('Manual purchase registration error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

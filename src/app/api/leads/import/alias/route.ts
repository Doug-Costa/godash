import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { ImportNormalizationService } from '@/lib/services/ImportNormalizationService';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await request.json();
    const { rawValue, productId } = payload;

    if (!rawValue || !productId) {
      return new NextResponse('rawValue e productId são obrigatórios.', { status: 400 });
    }

    const normalizedValue = ImportNormalizationService.normalizeString(rawValue);
    if (!normalizedValue) {
      return new NextResponse('rawValue inválido após normalização.', { status: 400 });
    }

    // Verifica se já existe (não deve estourar erro de unique se o frontend tentar mandar o mesmo num loop)
    const existing = await prisma.productAlias.findUnique({
      where: { normalizedValue }
    });

    if (existing) {
      // Se já existe mas pra outro produto, atualiza (o humano sobrescreveu)
      if (existing.productId !== productId) {
        await prisma.productAlias.update({
          where: { id: existing.id },
          data: { productId, createdBy: session.user.id }
        });
      }
      return NextResponse.json({ success: true, message: 'Alias atualizado.' });
    }

    // Cria novo
    const alias = await prisma.productAlias.create({
      data: {
        productId,
        rawValue,
        normalizedValue,
        sourceLabel: 'CSV_HITL',
        createdBy: session.user.id
      }
    });

    return NextResponse.json({ success: true, alias });
  } catch (error: any) {
    console.error('[Import Alias Error]', error);
    return new NextResponse(`Erro ao criar alias: ${error.message}`, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { IdentityMatchingService } from '@/lib/services/IdentityMatchingService';

/**
 * GET /api/leads/identity-review
 * Listar revisões de identidades pendentes (Admin Only)
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return new Response('Unauthorized', { status: 403 });
    }

    const reviews = await prisma.identityReview.findMany({
      where: { status: { in: ['PENDING', 'DEFERRED'] } },
      include: {
        candidatePerson: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: reviews });
  } catch (error: any) {
    console.error('GET identity-review error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/leads/identity-review
 * Submeter decisão Human-in-the-Loop (LINK, REJECT, DEFER)
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return new Response('Unauthorized', { status: 403 });
    }

    const userId = session.user.id || '';
    const body = await request.json();
    const { action, reviewId, personId } = body;

    if (!action || !reviewId) {
      return NextResponse.json({ success: false, error: 'Parâmetros inválidos. Informe action e reviewId.' }, { status: 400 });
    }

    if (action === 'LINK') {
      if (!personId) {
        return NextResponse.json({ success: false, error: 'personId é obrigatório para ação LINK.' }, { status: 400 });
      }
      await IdentityMatchingService.link(reviewId, personId, userId);
      return NextResponse.json({ success: true, message: 'Alias apontado e vinculado com sucesso.' });
    }

    if (action === 'REJECT') {
      const person = await IdentityMatchingService.reject(reviewId, userId);
      return NextResponse.json({ success: true, message: 'Vínculo rejeitado e nova Person criada.', data: person });
    }

    if (action === 'DEFER') {
      await IdentityMatchingService.defer(reviewId, userId);
      return NextResponse.json({ success: true, message: 'Decisão de vínculo postergada.' });
    }

    return NextResponse.json({ success: false, error: 'Ação não suportada.' }, { status: 400 });
  } catch (error: any) {
    console.error('POST identity-review error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

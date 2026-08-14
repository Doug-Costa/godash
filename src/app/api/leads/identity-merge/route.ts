import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { IdentityMatchingService } from '@/lib/services/IdentityMatchingService';

/**
 * POST /api/leads/identity-merge
 * Fusão administrativa segura de duas identidades (Person A -> Person B) (Admin Only)
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || (session.user as any)?.role !== 'ADMIN') {
      return new Response('Unauthorized', { status: 403 });
    }

    const userId = (session.user as any).id || '';
    const body = await request.json();
    const { sourcePersonId, targetPersonId, reason } = body;

    if (!sourcePersonId || !targetPersonId || !reason) {
      return NextResponse.json({ success: false, error: 'Parâmetros inválidos. Informe sourcePersonId, targetPersonId e reason.' }, { status: 400 });
    }

    await IdentityMatchingService.mergePersons(sourcePersonId, targetPersonId, userId, reason);

    return NextResponse.json({ success: true, message: 'Fusão de identidades concluída com sucesso!' });
  } catch (error: any) {
    console.error('POST identity-merge error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

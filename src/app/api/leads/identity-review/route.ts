import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { IdentityMatchingService } from '@/lib/services/IdentityMatchingService';

/**
 * GET /api/leads/identity-review
 * Listar revisões de identidades pendentes com dados comparativos da submissão vs candidato
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
        candidatePerson: {
          include: {
            customers: {
              include: {
                opportunities: {
                  include: { product: true }
                }
              }
            },
            identityAliases: {
              take: 5,
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Enriquecer cada review com os dados da submissão que gerou a revisão (via IdentityAlias)
    const enrichedReviews = await Promise.all(
      reviews.map(async (r) => {
        const alias = await prisma.identityAlias.findFirst({
          where: {
            source: r.incomingSource,
            externalId: r.incomingExternalId
          }
        });

        // Extrai as oportunidades já existentes do candidato para visualização rápida
        const existingOpportunities = r.candidatePerson?.customers?.flatMap(c => 
          c.opportunities?.map(o => ({
            id: o.id,
            stage: o.stage,
            productName: o.product?.name || 'Sem Produto',
            productCategory: o.product?.category || null
          })) || []
        ) || [];

        return {
          id: r.id,
          incomingSource: r.incomingSource,
          incomingExternalId: r.incomingExternalId,
          confidenceScore: r.confidenceScore,
          evidences: r.evidences,
          status: r.status,
          createdAt: r.createdAt,
          // Snapshot da entrada que gerou o conflito/revisão
          submission: {
            name: alias?.name || (alias?.rawData as any)?.fullName || null,
            email: alias?.email || (alias?.rawData as any)?.email || null,
            phone: alias?.phone || (alias?.rawData as any)?.phoneNumber || null,
            rawData: alias?.rawData || null
          },
          // Dados da Person candidata sugerida
          candidatePerson: r.candidatePerson ? {
            id: r.candidatePerson.id,
            fullName: r.candidatePerson.fullName,
            email: r.candidatePerson.email,
            phoneNumber: r.candidatePerson.phoneNumber,
            secondaryEmail: r.candidatePerson.secondaryEmail,
            secondaryPhone: r.candidatePerson.secondaryPhone,
            existingOpportunities
          } : null
        };
      })
    );

    return NextResponse.json({ success: true, data: enrichedReviews });
  } catch (error: any) {
    console.error('GET identity-review error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/leads/identity-review
 * Submeter decisão Human-in-the-Loop (LINK, SEPARATE, UPDATE_CANONICAL, DEFER)
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || (session.user as any)?.role !== 'ADMIN') {
      return new Response('Unauthorized', { status: 403 });
    }

    const userId = (session.user as any).id || '';
    const body = await request.json();
    const { action, reviewId, personId, fullName, email, phoneNumber } = body;

    // Ação avulsa de atualização canônica
    if (action === 'UPDATE_CANONICAL') {
      const targetId = personId || body.id;
      if (!targetId) {
        return NextResponse.json({ success: false, error: 'personId é obrigatório para UPDATE_CANONICAL.' }, { status: 400 });
      }
      const updated = await IdentityMatchingService.updateCanonicalPerson(
        targetId, 
        { fullName, email, phoneNumber },
        userId
      );
      return NextResponse.json({ success: true, message: 'Dados canônicos da pessoa atualizados com sucesso.', data: updated });
    }

    if (!action || !reviewId) {
      return NextResponse.json({ success: false, error: 'Parâmetros inválidos. Informe action e reviewId.' }, { status: 400 });
    }

    // 1. LINK: Confirma que a submissão pertence à Person candidata
    if (action === 'LINK' || action === 'LINK_TO_PERSON') {
      const targetId = personId || body.targetPersonId;
      if (!targetId) {
        return NextResponse.json({ success: false, error: 'personId ou targetPersonId é obrigatório para ação LINK.' }, { status: 400 });
      }
      await IdentityMatchingService.link(reviewId, targetId, userId);
      return NextResponse.json({ success: true, message: 'Identidade vinculada à Person canônica com sucesso.' });
    }

    // 2. SEPARATE ou REJECT: Confirma que a submissão é uma Person distinta e independente
    if (action === 'SEPARATE' || action === 'REJECT') {
      const person = await IdentityMatchingService.reject(reviewId, userId);
      return NextResponse.json({ success: true, message: 'Vínculo desfeito e nova Person autônoma confirmada.', data: person });
    }

    // 3. DEFER: Adiar decisão
    if (action === 'DEFER') {
      await IdentityMatchingService.defer(reviewId, userId);
      return NextResponse.json({ success: true, message: 'Decisão de revisão postergada.' });
    }

    return NextResponse.json({ success: false, error: 'Ação não suportada.' }, { status: 400 });
  } catch (error: any) {
    console.error('POST identity-review error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


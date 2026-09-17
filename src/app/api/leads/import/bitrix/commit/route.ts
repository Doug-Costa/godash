import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { BitrixCommitService } from '@/lib/services/BitrixCommitService';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { 
      fileName = 'bitrix_migration.csv',
      deals = [], 
      targetPipelineId,
      batchId,
      isFirstChunk = true,
      isLastChunk = false,
      totalExpectedDeals
    } = body;

    if (!Array.isArray(deals) || deals.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lista de negócios vazia para este lote.' },
        { status: 400 }
      );
    }

    // Gravação transacional do pedaço (chunk)
    const result = await BitrixCommitService.commitChunk({
      fileName,
      uploadedById: session.user.id,
      targetPipelineId,
      batchId,
      deals,
      isFirstChunk,
      isLastChunk,
      totalExpectedDeals: totalExpectedDeals || deals.length
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('[API Bitrix Commit Chunk] Erro:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao efetivar lote Bitrix' },
      { status: 500 }
    );
  }
}

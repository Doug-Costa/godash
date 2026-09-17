import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { BitrixPreflightService } from '@/lib/services/BitrixPreflightService';
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
      contacts = [], 
      deals = [], 
      operatorMaps = [], 
      productRules = [], 
      recencyCutoffDays = 90,
      targetPipelineId
    } = body;

    if (!Array.isArray(contacts) || !Array.isArray(deals) || (contacts.length === 0 && deals.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'Lista de contatos ou negócios vazia.' },
        { status: 400 }
      );
    }

    // 1. Re-executar preflight em memória para garantir consistência total
    const { processedDeals } = await BitrixPreflightService.simulate({
      contacts,
      deals,
      operatorMaps,
      productRules,
      recencyCutoffDays: Number(recencyCutoffDays) || 90
    });

    // 2. Gravação transacional
    const result = await BitrixCommitService.commit({
      fileName,
      uploadedById: session.user.id,
      targetPipelineId,
      deals: processedDeals
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('[API Bitrix Commit] Erro:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao efetivar lote Bitrix' },
      { status: 500 }
    );
  }
}

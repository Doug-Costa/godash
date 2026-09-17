import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { BitrixPreflightService } from '@/lib/services/BitrixPreflightService';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { 
      contacts = [], 
      deals = [], 
      operatorMaps = [], 
      productRules = [], 
      recencyCutoffDays = 90 
    } = body;

    if (!Array.isArray(contacts) || !Array.isArray(deals)) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros inválidos. É necessário enviar listas de contatos e negócios.' },
        { status: 400 }
      );
    }

    const result = await BitrixPreflightService.simulate({
      contacts,
      deals,
      operatorMaps,
      productRules,
      recencyCutoffDays: Number(recencyCutoffDays) || 90
    });

    return NextResponse.json({
      success: true,
      summary: result.summary,
      processedDeals: result.processedDeals,
      totalDeals: result.processedDeals.length
    });
  } catch (error: any) {
    console.error('[API Bitrix Preflight] Erro:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao processar preflight Bitrix' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ImportPreflightService } from '@/lib/services/ImportPreflightService';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new NextResponse('Nenhum arquivo enviado.', { status: 400 });
    }

    const text = await file.text();
    
    // Executa a análise profunda (Read-Only)
    const summary = await ImportPreflightService.analyzeCsv(text);

    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('[Import Preflight Error]', error);
    return new NextResponse(`Erro ao processar o CSV: ${error.message}`, { status: 500 });
  }
}

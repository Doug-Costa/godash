import { auth } from '@/auth';
import { CsvSchemaMappingService } from '@/lib/services/CsvSchemaMappingService';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) return new NextResponse('Nenhum arquivo CSV enviado.', { status: 400 });

    const inspection = CsvSchemaMappingService.inspect(await file.text());
    return NextResponse.json(inspection);
  } catch (error: any) {
    console.error('[CSV Schema Inspection Error]', error);
    return new NextResponse(`Erro ao inspecionar o layout: ${error.message}`, { status: 400 });
  }
}

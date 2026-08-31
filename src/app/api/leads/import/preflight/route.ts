import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ImportPreflightService } from '@/lib/services/ImportPreflightService';
import { CSV_CANONICAL_FIELDS, CsvColumnMapping } from '@/lib/services/CsvSchemaMappingService';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const mappingPayload = formData.get('mapping');

    if (!file) {
      return new NextResponse('Nenhum arquivo enviado.', { status: 400 });
    }

    let mapping: CsvColumnMapping | undefined;
    if (typeof mappingPayload === 'string') {
      const candidate = JSON.parse(mappingPayload) as Record<string, string>;
      const allowed = new Set<string>(CSV_CANONICAL_FIELDS);
      if (Object.values(candidate).some(value => !allowed.has(value))) {
        return new NextResponse('Mapeamento contém um campo de destino não permitido.', { status: 400 });
      }
      mapping = candidate as CsvColumnMapping;
    }

    const text = await file.text();
    
    // Executa a análise profunda (Read-Only)
    const summary = await ImportPreflightService.analyzeCsv(text, mapping);

    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('[Import Preflight Error]', error);
    return new NextResponse(`Erro ao processar o CSV: ${error.message}`, { status: 500 });
  }
}

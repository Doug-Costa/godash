import { NextResponse } from 'next/server';
import { CANONICAL_CSV_COLUMNS, MARKETING_CSV_COLUMNS } from '@/lib/domain/ImportContract';
import { auth } from '@/auth';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'canonical'; // canonical | marketing

    // Escolhe as colunas de acordo com o contrato selecionado
    const columns = type === 'marketing' ? MARKETING_CSV_COLUMNS : CANONICAL_CSV_COLUMNS;
    
    // Cabeçalho CSV
    const csvHeader = columns.join(',');
    
    // UTF-8 BOM para garantir que o Excel abra corretamente com os acentos
    const bom = '\uFEFF';
    
    // Monta o conteúdo final do CSV
    const csvContent = bom + csvHeader + '\n';

    // Gera um nome de arquivo indicativo da data/hora
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `template_importacao_${type}_${timestamp}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('[Import Template Error]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ImportCommitService } from '@/lib/services/ImportCommitService';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await request.json();
    const { batchInfo, rows } = payload;

    if (!batchInfo || !rows || !Array.isArray(rows)) {
      return new NextResponse('Payload inválido.', { status: 400 });
    }

    const result = await ImportCommitService.commit(
      {
        fileName: batchInfo.fileName,
        schemaVersion: batchInfo.schemaVersion || 'V4',
        uploadedById: session.user.id,
        importDestination: batchInfo.importDestination,
        productId: batchInfo.productId,
        pipelineId: batchInfo.pipelineId
      },
      rows
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Import Commit Error]', error);
    return new NextResponse(`Erro ao comitar a importação: ${error.message}`, { status: 500 });
  }
}

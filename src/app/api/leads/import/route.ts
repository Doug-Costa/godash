import { NextResponse } from 'next/server';
import { CustomerCreationService } from '@/lib/application/CustomerCreationService';
import { auth } from '@/auth';

export async function POST(request: Request) {
  try {
    const session = await auth();
    const authorId = (session?.user as any)?.id || null;
    
    const body = await request.json();
    const { mode, pipelineId, data, rows, source } = body;

    if (mode === 'manual') {
      const { name, email, phone, pipelineId: manualPipelineId, source: manualSource } = data;
      
      const customer = await CustomerCreationService.createOrMerge({
        pipelineId: manualPipelineId,
        source: manualSource || 'MANUAL',
        metadata: {
          name,
          email,
          phoneNumber: phone
        },
        authorId
      });

      return NextResponse.json({ success: true, data: customer });
    }

    if (mode === 'csv') {
      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json({ success: false, error: 'No rows provided' }, { status: 400 });
      }

      let successCount = 0;
      let failedCount = 0;

      for (const row of rows) {
        try {
          // Normaliza as chaves do CSV
          const normalizedRow: Record<string, string> = {};
          for (const key of Object.keys(row)) {
            normalizedRow[key.toLowerCase().trim()] = row[key];
          }

          const name = normalizedRow['nome'] || normalizedRow['name'] || 'Sem Nome';
          const email = normalizedRow['email'] || null;
          const phone = normalizedRow['telefone'] || normalizedRow['phone'] || normalizedRow['whatsapp'] || null;
          const stage = normalizedRow['stage'] || 'novo_cadastro';
          const externalPersonId = normalizedRow['id'] ? Number(normalizedRow['id']) : undefined;

          await CustomerCreationService.createOrMerge({
            externalPersonId: !isNaN(externalPersonId as any) ? externalPersonId : undefined,
            pipelineId,
            stage,
            source: source || 'CSV',
            metadata: {
              name,
              email,
              phoneNumber: phone,
              ...normalizedRow
            },
            authorId
          });

          successCount++;
        } catch (err) {
          console.error('[CSV Import] Error importing row', row, err);
          failedCount++;
        }
      }

      return NextResponse.json({ success: true, successCount, failedCount });
    }

    return NextResponse.json({ success: false, error: 'Invalid mode' }, { status: 400 });

  } catch (error: any) {
    console.error('[Leads Import API] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
}

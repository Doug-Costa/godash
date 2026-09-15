import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return new Response('Unauthorized', { status: 403 });
    }

    const batches = await prisma.importBatch.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        fileName: true,
        schemaVersion: true,
        status: true,
        totalRows: true,
        successRows: true,
        warningRows: true,
        errorRows: true,
        createdAt: true
      }
    });

    return NextResponse.json({ success: true, data: batches });
  } catch (error: any) {
    console.error('GET /api/batches error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const pipelines = await prisma.pipeline.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, data: pipelines });
  } catch (error: any) {
    console.error('[Pipelines GET Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

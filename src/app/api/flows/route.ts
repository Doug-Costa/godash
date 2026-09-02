import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { CampaignOrchestrationService } from '@/lib/application/CampaignOrchestrationService';

export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });
  const flows = await prisma.flow.findMany({
    include: {
      versions: { include: { steps: { orderBy: { order: 'asc' } } }, orderBy: { version: 'desc' } },
      _count: { select: { campaigns: true, executions: true } }
    },
    orderBy: { updatedAt: 'desc' }
  });
  return NextResponse.json({ success: true, data: flows });
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'ADMIN') return new Response('Unauthorized', { status: 403 });
    const body = await request.json();
    if (!body.name) throw new Error('Nome do fluxo é obrigatório.');
    const result = await CampaignOrchestrationService.saveFlow(body);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'ADMIN') return new Response('Unauthorized', { status: 403 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'ID obrigatório.' }, { status: 400 });
  const campaigns = await prisma.campaign.count({ where: { flowId: id } });
  if (campaigns) return NextResponse.json({ success: false, error: 'Fluxo vinculado a campanhas não pode ser excluído; arquive-o.' }, { status: 409 });
  await prisma.flow.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

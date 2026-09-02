import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { CampaignOrchestrationService } from '@/lib/application/CampaignOrchestrationService';

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'ADMIN') throw new Error('UNAUTHORIZED');
}

export async function GET() {
  try {
    await requireAdmin();
    const campaigns = await prisma.campaign.findMany({
      include: {
        product: true,
        pipeline: true,
        flow: true,
        flowVersion: true,
        operators: { include: { user: { select: { id: true, name: true, email: true, isActive: true } } } },
        audience: {
          where: { status: 'PLANNED' },
          include: { customer: { include: { person: { select: { fullName: true, email: true, phoneNumber: true } } } } }
        },
        _count: { select: { audience: true, enrollments: true, opportunities: true, forms: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ success: true, data: campaigns });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.message === 'UNAUTHORIZED' ? 403 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    if (body.action === 'save-draft') {
      if (!body.name || !body.campaignNature) throw new Error('Nome e natureza são obrigatórios.');
      const campaign = await CampaignOrchestrationService.saveDraft(body, body.campaignId);
      return NextResponse.json({ success: true, data: campaign });
    }
    if (body.action === 'preflight') {
      const result = await CampaignOrchestrationService.preflight(body.campaignId, body.customerIds || []);
      return NextResponse.json({ success: true, data: result });
    }
    if (body.action === 'stage-audience') {
      const result = await CampaignOrchestrationService.stageAudience(body.campaignId, body.customerIds || [], body.sourceType || 'MANUAL');
      return NextResponse.json({ success: true, data: result });
    }
    if (body.action === 'remove-audience') {
      const result = await CampaignOrchestrationService.removeFromAudience(body.campaignId, body.customerIds || []);
      return NextResponse.json({ success: true, data: result });
    }
    if (body.action === 'test') {
      const result = await CampaignOrchestrationService.enroll(body.campaignId, body.customerIds || [], {
        activate: body.action === 'activate',
        test: true,
        sourceType: 'TEST',
        fixedAssigneeId: body.fixedAssigneeId
      });
      return NextResponse.json({ success: true, count: result.length, data: result });
    }
    if (body.action === 'activate' || body.action === 'enroll') {
      const result = await CampaignOrchestrationService.enroll(body.campaignId, body.customerIds || [], {
        sourceType: body.sourceType || 'SEGMENT',
        sourceFormId: body.sourceFormId,
        fixedAssigneeId: body.fixedAssigneeId
      });
      return NextResponse.json({ success: true, count: result.length, data: result });
    }
    if (body.action === 'pause') {
      await prisma.campaign.update({ where: { id: body.campaignId }, data: { status: 'PAUSED' } });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, error: 'Ação inválida.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.message === 'UNAUTHORIZED' ? 403 : 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'ID obrigatório.' }, { status: 400 });
    const enrollments = await prisma.campaignEnrollment.count({ where: { campaignId: id } });
    if (enrollments) {
      await prisma.campaign.update({ where: { id }, data: { status: 'COMPLETED' } });
      return NextResponse.json({ success: true, archived: true });
    }
    await prisma.campaign.delete({ where: { id } });
    return NextResponse.json({ success: true, archived: false });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

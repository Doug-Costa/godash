import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

// Middleware logic replacement for route check
async function getAdminSession() {
  const session = await auth();
  if (!session || !session.user) return null;
  const role = (session.user as any).role || 'AGENT';
  if (role !== 'ADMIN') return null;
  return session;
}

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const forms = await prisma.form.findMany({
      include: {
        fields: {
          orderBy: { order: 'asc' }
        },
        pipeline: {
          select: { id: true, name: true }
        },
        campaign: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: forms });
  } catch (error: any) {
    console.error('[Forms GET Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { name, redirectUrl, successMessage, styleConfig, pipelineId, stageId, campaignId, fields } = body;

    if (!name || !pipelineId) {
      return NextResponse.json({ success: false, error: 'name e pipelineId são obrigatórios' }, { status: 400 });
    }

    const form = await prisma.form.create({
      data: {
        name,
        redirectUrl,
        successMessage,
        styleConfig: styleConfig || {},
        pipelineId,
        stageId,
        campaignId,
        fields: {
          create: (fields || []).map((f: any, idx: number) => ({
            name: f.name,
            label: f.label,
            type: f.type || 'text',
            options: f.options || [],
            required: !!f.required,
            order: f.order ?? idx
          }))
        }
      },
      include: {
        fields: true
      }
    });

    return NextResponse.json({ success: true, data: form });
  } catch (error: any) {
    console.error('[Forms POST Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { id, name, redirectUrl, successMessage, styleConfig, pipelineId, stageId, campaignId, fields } = body;

    if (!id || !name || !pipelineId) {
      return NextResponse.json({ success: false, error: 'id, name e pipelineId são obrigatórios' }, { status: 400 });
    }

    // Delete existing fields first to replace them entirely
    await prisma.formField.deleteMany({
      where: { formId: id }
    });

    const form = await prisma.form.update({
      where: { id },
      data: {
        name,
        redirectUrl,
        successMessage,
        styleConfig: styleConfig || {},
        pipelineId,
        stageId,
        campaignId,
        fields: {
          create: (fields || []).map((f: any, idx: number) => ({
            name: f.name,
            label: f.label,
            type: f.type || 'text',
            options: f.options || [],
            required: !!f.required,
            order: f.order ?? idx
          }))
        }
      },
      include: {
        fields: true
      }
    });

    return NextResponse.json({ success: true, data: form });
  } catch (error: any) {
    console.error('[Forms PUT Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'id é obrigatório' }, { status: 400 });
    }

    await prisma.form.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Formulário excluído com sucesso.' });
  } catch (error: any) {
    console.error('[Forms DELETE Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

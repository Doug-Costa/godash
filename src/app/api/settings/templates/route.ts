import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return new Response('Unauthorized', { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const lang = searchParams.get('lang');

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (lang) where.language = lang;

    const templates = await prisma.template.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: templates });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return new Response('Unauthorized', { status: 403 });
    }

    const body = await request.json();
    const { id, name, description, type, version, status, language, subject, content, variables } = body;

    if (!name || !type || !content) {
      return NextResponse.json({ success: false, error: 'Nome, tipo e conteúdo do template são obrigatórios.' }, { status: 400 });
    }

    const payload = {
      name,
      description,
      type,
      version: version ? Number(version) : 1,
      status: status || 'ACTIVE',
      language: language || 'PT',
      subject: subject || null,
      content,
      variables: variables || [],
    };

    if (id) {
      const updated = await prisma.template.update({
        where: { id },
        data: payload,
      });
      return NextResponse.json({ success: true, data: updated });
    } else {
      const created = await prisma.template.create({
        data: payload,
      });
      return NextResponse.json({ success: true, data: created });
    }
  } catch (error: any) {
    console.error('POST template error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro ao salvar template.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return new Response('Unauthorized', { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID do template é obrigatório.' }, { status: 400 });
    }

    await prisma.template.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Template excluído com sucesso.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { encrypt, decrypt } from '@/lib/crypto';
import nodemailer from 'nodemailer';

// Helper to mask passwords in response
function maskPassword(config: any) {
  return { ...config, pass: '••••••••' };
}

export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return new Response('Unauthorized', { status: 403 });
    }

    const configs = await prisma.smtpConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: configs.map(maskPassword) });
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
    const { action } = body;

    // 1. Ação de Teste de Conexão SMTP
    if (action === 'test') {
      const { host, port, user, pass, secure, id } = body;
      
      let passwordToTest = pass;
      if (pass === '••••••••' && id) {
        const existing = await prisma.smtpConfig.findUnique({ where: { id } });
        if (existing) {
          passwordToTest = decrypt(existing.pass);
        }
      }

      const transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure: secure === true || secure === 'true',
        auth: {
          user,
          pass: passwordToTest,
        },
      });

      await transporter.verify();
      return NextResponse.json({ success: true, message: 'Conexão SMTP validada com sucesso!' });
    }

    // 2. Ação de Ativar SMTP
    if (action === 'activate') {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ success: false, error: 'ID do SMTP é obrigatório.' }, { status: 400 });
      }

      await prisma.$transaction([
        prisma.smtpConfig.updateMany({
          data: { active: false },
        }),
        prisma.smtpConfig.update({
          where: { id },
          data: { active: true },
        }),
      ]);

      return NextResponse.json({ success: true, message: 'SMTP ativado com sucesso.' });
    }

    // 3. Salvar / Atualizar SMTP
    const { id, name, host, port, user, pass, secure } = body;

    if (!name || !host || !port || !user || !pass) {
      return NextResponse.json({ success: false, error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    const encryptedPassword = (pass === '••••••••' && id)
      ? undefined // Keep existing if not modified
      : encrypt(pass);

    const payload: any = {
      name,
      host,
      port: Number(port),
      user,
      secure: secure === true || secure === 'true',
    };

    if (encryptedPassword) {
      payload.pass = encryptedPassword;
    }

    if (id) {
      const updated = await prisma.smtpConfig.update({
        where: { id },
        data: payload,
      });
      return NextResponse.json({ success: true, data: maskPassword(updated) });
    } else {
      // Se for a primeira configuração, já define como ativa
      const count = await prisma.smtpConfig.count();
      payload.active = count === 0;

      const created = await prisma.smtpConfig.create({
        data: payload,
      });
      return NextResponse.json({ success: true, data: maskPassword(created) });
    }
  } catch (error: any) {
    console.error('POST smtpConfig error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro ao salvar SMTP.' }, { status: 500 });
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
      return NextResponse.json({ success: false, error: 'ID do SMTP é obrigatório.' }, { status: 400 });
    }

    await prisma.smtpConfig.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'SMTP excluído com sucesso.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * GET    /api/post-sales/sequences   — Lista todas as sequências
 * POST   /api/post-sales/sequences   — Cria nova sequência
 * PATCH  /api/post-sales/sequences   — Atualiza sequência existente
 * DELETE /api/post-sales/sequences   — Desativa sequência (soft delete via isActive=false)
 */

import { NextResponse } from 'next/server';
import { PrismaPostSaleRepository } from '@/lib/repositories/PrismaPostSaleRepository';
import type { CreateSequenceInput, PostSaleTargetSegment } from '@/lib/domain/post-sale.types';

const repo = new PrismaPostSaleRepository();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const onlyActive = searchParams.get('active') === 'true';

  try {
    const sequences = await repo.listSequences(onlyActive);
    return NextResponse.json({ success: true, count: sequences.length, sequences });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, triggerDays, templateMessage, isActive, targetSegment } = body as {
      name: string;
      triggerDays: number;
      templateMessage: string;
      isActive?: boolean;
      targetSegment?: PostSaleTargetSegment;
    };

    if (!name || triggerDays === undefined || !templateMessage) {
      return NextResponse.json(
        { error: 'name, triggerDays e templateMessage são obrigatórios' },
        { status: 400 }
      );
    }

    const input: CreateSequenceInput = { name, triggerDays, templateMessage, isActive, targetSegment };
    const sequence = await repo.createSequence(input);

    return NextResponse.json({ success: true, sequence }, { status: 201 });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body as { id: string } & Partial<CreateSequenceInput>;

    if (!id) {
      return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });
    }

    const sequence = await repo.updateSequence(id, data);
    return NextResponse.json({ success: true, sequence });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/** Soft delete: desativa a sequência (não apaga, para preservar histórico de tasks) */
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body as { id: string };

    if (!id) {
      return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });
    }

    const sequence = await repo.updateSequence(id, { isActive: false });
    return NextResponse.json({ success: true, message: 'Sequência desativada.', sequence });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

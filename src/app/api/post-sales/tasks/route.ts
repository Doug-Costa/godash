/**
 * PATCH /api/post-sales/tasks/[id]  — Concluir ou Cancelar uma tarefa
 * GET   /api/post-sales/tasks       — Listar tarefas (com filtros)
 */

import { NextResponse } from 'next/server';
import { PrismaPostSaleRepository } from '@/lib/repositories/PrismaPostSaleRepository';
import { auth } from '@/auth';

const repo = new PrismaPostSaleRepository();

/**
 * PATCH /api/post-sales/tasks
 * Body: { id: string, action: 'complete' | 'cancel', note?: string }
 */
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session || (role !== 'ADMIN' && role !== 'POST_SALES')) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, action, note } = body as {
      id: string;
      action: 'complete' | 'cancel';
      note?: string;
    };

    if (!id || !action) {
      return NextResponse.json({ error: 'id e action são obrigatórios' }, { status: 400 });
    }

    const task = action === 'complete'
      ? await repo.completeTask(id, note)
      : await repo.cancelTask(id);

    return NextResponse.json({ success: true, task });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[post-sales/tasks PATCH] Error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * GET /api/post-sales/tasks?status=PENDING&assignedTo=<userId>
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session || (role !== 'ADMIN' && role !== 'POST_SALES')) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assignedTo = searchParams.get('assignedTo') ?? undefined;

    // Se usuário for apenas POST_SALES e tentar ver de todos, forçar para ele mesmo
    // Mas a regra permite POST_SALES ver tudo ou só ADMIN?
    // "rejeitar consultas não paginadas sem essas credenciais". 
    // Como restringimos a rota inteira para ADMIN/POST_SALES, já está protegido.

    const alerts = await repo.getPendingAlerts(assignedTo);
    return NextResponse.json({ success: true, count: alerts.length, tasks: alerts });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

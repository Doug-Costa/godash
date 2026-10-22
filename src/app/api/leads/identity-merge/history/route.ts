import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { MergeUndoService } from '@/lib/services/MergeUndoService';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as any)?.role !== 'ADMIN') return null;
  return session;
}

/**
 * GET /api/leads/identity-merge/history?limit=30&offset=0
 * Junções recentes, com quem decidiu e se podem ser desfeitas (somente ADMIN).
 */
export async function GET(request: Request) {
  if (!(await requireAdmin())) return new Response('Unauthorized', { status: 403 });
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 30, 1), 100);
  const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);

  const [events, total] = await Promise.all([
    prisma.mergeEvent.findMany({
      orderBy: { timestamp: 'desc' },
      skip: offset,
      take: limit,
      include: { decidedBy: { select: { name: true, email: true } } },
    }),
    prisma.mergeEvent.count(),
  ]);
  const targets = new Map(
    (await prisma.person.findMany({
      where: { id: { in: events.map(e => e.targetPersonId) } },
      select: { id: true, fullName: true, email: true },
    })).map(p => [p.id, p]),
  );
  const undoUserIds = events.map(e => (e.metadata as any)?.undone?.byUserId).filter(Boolean);
  const undoUsers = new Map(
    (await prisma.user.findMany({ where: { id: { in: undoUserIds } }, select: { id: true, name: true, email: true } })).map(u => [u.id, u]),
  );

  const data = events.map(e => {
    const meta = (e.metadata ?? {}) as any;
    const undone = meta.undone
      ? { ...meta.undone, byName: undoUsers.get(meta.undone.byUserId)?.name || undoUsers.get(meta.undone.byUserId)?.email || null }
      : null;
    return {
      id: e.id,
      timestamp: e.timestamp,
      reason: e.reason,
      decidedBy: e.decidedBy?.name || e.decidedBy?.email || null,
      absorbed: { id: e.sourcePersonId, fullName: meta.sourcePerson?.fullName ?? null, email: meta.sourcePerson?.email ?? null },
      kept: targets.get(e.targetPersonId) ?? { id: e.targetPersonId, fullName: null, email: null },
      undone,
      canUndo: meta.version === 2 && !meta.undone,
    };
  });
  return NextResponse.json({ success: true, data, total });
}

/**
 * POST /api/leads/identity-merge/history
 *  { action: 'PREVIEW', mergeEventId }          → relatório do que voltaria (nada é gravado)
 *  { action: 'UNDO', mergeEventId, reason }     → desfaz e registra quem/quando/por quê
 */
export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return new Response('Unauthorized', { status: 403 });
  try {
    const { action, mergeEventId, reason } = await request.json();
    if (!mergeEventId) return NextResponse.json({ success: false, error: 'Informe mergeEventId.' }, { status: 400 });
    if (action === 'PREVIEW') {
      return NextResponse.json({ success: true, report: await MergeUndoService.preview(mergeEventId) });
    }
    if (action === 'UNDO') {
      const report = await MergeUndoService.undo(mergeEventId, (session.user as any).id || '', reason);
      return NextResponse.json({ success: true, report });
    }
    return NextResponse.json({ success: false, error: 'Ação não suportada.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

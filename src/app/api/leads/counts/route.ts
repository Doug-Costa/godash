import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const role = (session.user as any).role || 'AGENT';
    const userId = session.user.id;
    const isAgent = role === 'AGENT' || role === 'POST_SALES';

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // YYYY-MM
    const hasMonthFilter = month && month !== 'all';

    let endOfMonth: Date | null = null;
    if (hasMonthFilter) {
      const parts = month.split('-');
      const y = Number(parts[0]);
      const m = Number(parts[1]);
      const lastDay = new Date(y, m, 0).getDate();
      const padM = String(m).padStart(2, '0');
      const padD = String(lastDay).padStart(2, '0');
      endOfMonth = new Date(`${y}-${padM}-${padD}T23:59:59.999Z`);
    }

    // 1. Campanhas (leads com tarefas pendentes de automação)
    const campanhasCount = await prisma.customer.count({
      where: {
        assigneeId: isAgent ? userId : undefined,
        tasks: {
          some: {
            completedAt: null,
            automationId: { not: null },
            scheduledFor: hasMonthFilter ? { lte: endOfMonth! } : undefined
          }
        }
      }
    });

    // 2. Alertas (alerts - leads com qualquer tarefa pendente)
    const alertsCount = await prisma.customer.count({
      where: {
        assigneeId: isAgent ? userId : undefined,
        tasks: {
          some: {
            completedAt: null,
            scheduledFor: hasMonthFilter ? { lte: endOfMonth! } : undefined
          }
        }
      }
    });

    // 3. Cancelados
    let canceladosCount = 0;
    let canceladosQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM people p
      INNER JOIN subscriptions s ON s.personId = p.id
      WHERE (s.status = 'canceled' OR s.canceledAt IS NOT NULL)
    `;
    const canceladosParams: any[] = [];
    if (hasMonthFilter) {
      canceladosQuery += ` AND DATE_FORMAT(s.canceledAt, '%Y-%m') = ?`;
      canceladosParams.push(month);
    }
    if (isAgent) {
      const assigned = await prisma.customer.findMany({
        where: { assigneeId: userId },
        select: { externalPersonId: true }
      });
      const ids = assigned.map(c => c.externalPersonId);
      if (ids.length > 0) {
        canceladosQuery += ` AND p.id IN (?)`;
        canceladosParams.push(ids);
      } else {
        canceladosQuery += ` AND 1=0`;
      }
    }
    const [canceladosRows] = await pool.query(canceladosQuery, canceladosParams);
    canceladosCount = (canceladosRows as any[])[0]?.total || 0;

    // 4. A Expirar (assinaturas ativas expirando no período)
    let expirarQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM people p
      INNER JOIN subscriptions s ON s.personId = p.id
      WHERE s.status = 'active'
    `;
    const expirarParams: any[] = [];
    if (hasMonthFilter) {
      expirarQuery += ` AND DATE_FORMAT(COALESCE(s.isValidUntil, s.expiresIn), '%Y-%m') = ?`;
      expirarParams.push(month);
    } else {
      expirarQuery += `
        AND COALESCE(s.isValidUntil, s.expiresIn) >= CURDATE()
        AND COALESCE(s.isValidUntil, s.expiresIn) <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      `;
    }
    if (isAgent) {
      const assigned = await prisma.customer.findMany({
        where: { assigneeId: userId },
        select: { externalPersonId: true }
      });
      const ids = assigned.map(c => c.externalPersonId);
      if (ids.length > 0) {
        expirarQuery += ` AND p.id IN (?)`;
        expirarParams.push(ids);
      } else {
        expirarQuery += ` AND 1=0`;
      }
    }
    const [expirarRows] = await pool.query(expirarQuery, expirarParams);
    const expirarCount = (expirarRows as any[])[0]?.total || 0;

    // 5. Abandonados (sem operador e sem plano ativo)
    const assigned = await prisma.customer.findMany({
      where: { assigneeId: { not: null } },
      select: { externalPersonId: true }
    });
    const assignedIds = assigned.map(c => c.externalPersonId);

    let abandonadosQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM people p
      LEFT JOIN subscriptions s ON s.personId = p.id
      LEFT JOIN plans pl ON s.planId = pl.id
      WHERE pl.id IS NULL
    `;
    const abandonadosParams: any[] = [];
    if (hasMonthFilter) {
      abandonadosQuery += ` AND DATE_FORMAT(p.createdAt, '%Y-%m') = ?`;
      abandonadosParams.push(month);
    }
    if (assignedIds.length > 0) {
      abandonadosQuery += ` AND p.id NOT IN (?)`;
      abandonadosParams.push(assignedIds);
    }
    const [abandonadosRows] = await pool.query(abandonadosQuery, abandonadosParams);
    const abandonadosCount = (abandonadosRows as any[])[0]?.total || 0;

    return NextResponse.json({
      success: true,
      data: {
        campanhas: campanhasCount,
        alerts: alertsCount,
        cancelados: canceladosCount,
        expirar: expirarCount,
        abandonados: abandonadosCount
      }
    });
  } catch (err: any) {
    console.error('Counts API error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

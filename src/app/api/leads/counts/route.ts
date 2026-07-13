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

    // 1. Campanhas (leads com tarefas pendentes de automação)
    const campanhasCount = await prisma.customer.count({
      where: {
        assigneeId: isAgent ? userId : undefined,
        tasks: {
          some: {
            completedAt: null,
            automationId: { not: null }
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
            completedAt: null
          }
        }
      }
    });

    // 3. Cancelados
    const canceladosCount = await prisma.customer.count({
      where: {
        assigneeId: isAgent ? userId : undefined,
        tag: 'CANCELED_CLIENT'
      }
    });

    // 4. A Expirar (assinaturas ativas expirando em 30 dias)
    let expirarQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM people p
      INNER JOIN subscriptions s ON s.personId = p.id
      WHERE s.status = 'active'
        AND COALESCE(s.isValidUntil, s.expiresIn) >= CURDATE()
        AND COALESCE(s.isValidUntil, s.expiresIn) <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
    `;
    const expirarParams: any[] = [];
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

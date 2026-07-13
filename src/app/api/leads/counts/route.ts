import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import pool from '@/lib/db';
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

    // 1. Campanhas Count
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

    // 2. Alertas Count
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

    // 3. Cancelados Count
    const canceladosCount = await prisma.customer.count({
      where: {
        assigneeId: isAgent ? userId : undefined,
        tag: 'CANCELED_CLIENT'
      }
    });

    // 4. A Expirar Count
    // Pegar IDs atribuídos no Postgres (se for agente, apenas os dele; se admin, todos)
    const assignedStates = await prisma.customer.findMany({
      where: isAgent ? { assigneeId: userId } : { assigneeId: { not: null } },
      select: { externalPersonId: true }
    });
    const assignedIds = assignedStates.map(s => s.externalPersonId);

    let expiringQuery = `
      SELECT COUNT(DISTINCT p.id) as total 
      FROM subscriptions s
      INNER JOIN people p ON s.personId = p.id
      WHERE s.status = 'active'
        AND COALESCE(s.isValidUntil, s.expiresIn) >= CURDATE()
        AND COALESCE(s.isValidUntil, s.expiresIn) <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
    `;
    const expiringParams: any[] = [];
    if (isAgent) {
      if (assignedIds.length > 0) {
        expiringQuery += ` AND p.id IN (?)`;
        expiringParams.push(assignedIds);
      } else {
        expiringQuery += ` AND 1=0`; // Agente sem clientes não vê nenhum
      }
    }

    const [expiringRows] = await pool.query(expiringQuery, expiringParams);
    const expirarCount = (expiringRows as any[])[0]?.total || 0;

    // 5. Abandonados Count (Oportunidades gerais: sem responsável atribuído)
    const assignedCustomers = await prisma.customer.findMany({
      where: { assigneeId: { not: null } },
      select: { externalPersonId: true }
    });
    const allAssignedIds = assignedCustomers.map(c => c.externalPersonId);

    let abandonadosQuery = `SELECT COUNT(*) as total FROM people p WHERE 1=1`;
    const abandonadosParams: any[] = [];
    if (allAssignedIds.length > 0) {
      abandonadosQuery += ` AND p.id NOT IN (?)`;
      abandonadosParams.push(allAssignedIds);
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
  } catch (error: any) {
    console.error('Error fetching leads counts:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

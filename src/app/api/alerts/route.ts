import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import pool from '@/lib/db';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;

    // 1. TaskAlerts do Usuário
    const alerts = await prisma.taskAlert.findMany({
      where: {
        assignedToId: userId,
        status: 'PENDING',
        scheduledFor: { lte: new Date() }
      },
      include: {
        leadState: true,
        flowStep: true
      },
      orderBy: { scheduledFor: 'asc' }
    });

    // Enriquecer TaskAlerts com dados do MySQL
    let enrichedAlerts: any[] = [];
    if (alerts.length > 0) {
      const personIds = alerts.map(a => a.leadState.externalPersonId);
      const [peopleRows] = await pool.query(
        'SELECT id, fullName, email, phoneNumber FROM people WHERE id IN (?)',
        [personIds]
      );
      const peopleMap = new Map((peopleRows as any[]).map(p => [p.id, p]));

      enrichedAlerts = alerts.map(alert => {
        const person = peopleMap.get(alert.leadState.externalPersonId);
        return {
          ...alert,
          personName: person?.fullName || 'Cliente Indefinido',
          personEmail: person?.email || '',
          personPhone: person?.phoneNumber || '',
          renderedMessage: alert.flowStep?.messageTemplate
            ? alert.flowStep.messageTemplate.replace(/\{\{nome\}\}/gi, person?.fullName || 'Doutor(a)')
            : ''
        };
      });
    }

    // 2. Carrinhos Abandonados (Leads Órfãos)
    const [orphans] = await pool.query(`
      SELECT p.id, p.fullName, p.email, p.phoneNumber, p.createdAt 
      FROM people p
      WHERE NOT EXISTS (
        SELECT 1 FROM subscriptions s 
        WHERE s.personId = p.id AND s.status = 'active'
      )
      ORDER BY p.createdAt DESC
      LIMIT 100
    `);

    let orphanedLeads: any[] = [];
    if ((orphans as any[]).length > 0) {
      const orphanIds = (orphans as any[]).map(o => o.id);
      const assignedLeadStates = await prisma.leadState.findMany({
        where: {
          externalPersonId: { in: orphanIds },
          assigneeId: { not: null }
        },
        select: { externalPersonId: true }
      });
      const assignedIdsSet = new Set(assignedLeadStates.map(l => l.externalPersonId));
      orphanedLeads = (orphans as any[]).filter(o => !assignedIdsSet.has(o.id));
    }

    // 3. Clientes à expirar (Assinaturas expirando nos próximos 30 dias que pertencem a mim)
    const myLeads = await prisma.leadState.findMany({
      where: { assigneeId: userId },
      select: { externalPersonId: true }
    });

    let expiringLeads: any[] = [];
    if (myLeads.length > 0) {
      const myLeadIds = myLeads.map(l => l.externalPersonId);
      const [expiring] = await pool.query(`
        SELECT p.id, p.fullName, p.email, p.phoneNumber, s.expiresIn, pl.title as planTitle
        FROM subscriptions s
        INNER JOIN people p ON s.personId = p.id
        INNER JOIN plans pl ON s.planId = pl.id
        WHERE s.status = 'active'
          AND s.expiresIn IS NOT NULL
          AND s.expiresIn >= CURDATE()
          AND s.expiresIn <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
          AND p.id IN (?)
      `, [myLeadIds]);
      expiringLeads = expiring as any[];
    }

    return NextResponse.json({
      success: true,
      data: {
        taskAlerts: enrichedAlerts,
        orphanedLeads,
        expiringLeads
      }
    });

  } catch (error: any) {
    console.error('GET alerts error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { action } = body;

    // 1. Assumir lead órfão
    if (action === 'claim') {
      const { personId } = body;
      if (!personId) {
        return NextResponse.json({ success: false, error: 'personId é obrigatório' }, { status: 400 });
      }

      const leadState = await prisma.leadState.upsert({
        where: { externalPersonId: Number(personId) },
        update: {
          assigneeId: userId,
          stage: 'novo_cadastro',
          frozenUntil: null,
          freezeReason: null,
          lostReason: null
        },
        create: {
          externalPersonId: Number(personId),
          assigneeId: userId,
          stage: 'novo_cadastro'
        }
      });

      await prisma.leadInteraction.create({
        data: {
          leadStateId: leadState.id,
          authorId: userId,
          text: 'Assumiu o atendimento deste carrinho abandonado/lead órfão.'
        }
      });

      return NextResponse.json({ success: true, data: leadState });
    }

    // 2. Concluir alerta
    if (action === 'complete') {
      const { alertId, note } = body;
      if (!alertId) {
        return NextResponse.json({ success: false, error: 'alertId é obrigatório' }, { status: 400 });
      }

      const alert = await prisma.taskAlert.update({
        where: { id: alertId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          completionNote: note || ''
        }
      });

      await prisma.leadInteraction.create({
        data: {
          leadStateId: alert.leadStateId,
          authorId: userId,
          text: `Tarefa concluída (${alert.taskType}): ${note || 'Sem observações.'}`
        }
      });

      return NextResponse.json({ success: true, data: alert });
    }

    // 3. Pular alerta
    if (action === 'skip') {
      const { alertId, note } = body;
      if (!alertId) {
        return NextResponse.json({ success: false, error: 'alertId é obrigatório' }, { status: 400 });
      }

      const alert = await prisma.taskAlert.update({
        where: { id: alertId },
        data: {
          status: 'SKIPPED',
          completedAt: new Date(),
          completionNote: note || ''
        }
      });

      await prisma.leadInteraction.create({
        data: {
          leadStateId: alert.leadStateId,
          authorId: userId,
          text: `Tarefa pulada/remarcada (${alert.taskType}): ${note || 'Sem observações.'}`
        }
      });

      return NextResponse.json({ success: true, data: alert });
    }

    return NextResponse.json({ success: false, error: 'Ação inválida' }, { status: 400 });

  } catch (error: any) {
    console.error('POST alerts error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

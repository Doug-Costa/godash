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

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    // Parâmetros de Paginação
    const taskPage = Math.max(1, Number(searchParams.get('taskPage') || 1));
    const taskLimit = Math.max(1, Number(searchParams.get('taskLimit') || 10));
    const taskOffset = (taskPage - 1) * taskLimit;

    const orphanPage = Math.max(1, Number(searchParams.get('orphanPage') || 1));
    const orphanLimit = Math.max(1, Number(searchParams.get('orphanLimit') || 10));
    const orphanOffset = (orphanPage - 1) * orphanLimit;
    const orphanMonth = searchParams.get('orphanMonth') || 'all';

    const expiringPage = Math.max(1, Number(searchParams.get('expiringPage') || 1));
    const expiringLimit = Math.max(1, Number(searchParams.get('expiringLimit') || 10));
    const expiringOffset = (expiringPage - 1) * expiringLimit;

    // 1. TaskAlerts do Usuário (Prisma - SQLite)
    const taskAlertsCount = await prisma.taskAlert.count({
      where: {
        assignedToId: userId,
        status: 'PENDING',
        scheduledFor: { lte: new Date() },
        OR: [
          { leadState: { frozenUntil: null } },
          { leadState: { frozenUntil: { lt: new Date() } } }
        ]
      }
    });

    const alerts = await prisma.taskAlert.findMany({
      where: {
        assignedToId: userId,
        status: 'PENDING',
        scheduledFor: { lte: new Date() },
        OR: [
          { leadState: { frozenUntil: null } },
          { leadState: { frozenUntil: { lt: new Date() } } }
        ]
      },
      include: {
        leadState: {
          include: {
            campaign: { select: { name: true } }
          }
        },
        flowStep: true
      },
      orderBy: { scheduledFor: 'asc' },
      skip: taskOffset,
      take: taskLimit
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

      // Buscar última interação para cada lead para usar de fallback se não houver flowStep
      const leadStateIds = alerts.map(a => a.leadStateId);
      const latestInteractions = await prisma.leadInteraction.findMany({
        where: { leadStateId: { in: leadStateIds } },
        orderBy: { createdAt: 'desc' }
      });
      const interactionMap = new Map();
      latestInteractions.forEach(i => {
        if (!interactionMap.has(i.leadStateId)) {
          interactionMap.set(i.leadStateId, i.text);
        }
      });

      enrichedAlerts = alerts.map(alert => {
        const person = peopleMap.get(alert.leadState.externalPersonId);
        return {
          ...alert,
          personName: person?.fullName || 'Cliente Indefinido',
          personEmail: person?.email || '',
          personPhone: person?.phoneNumber || '',
          campaignName: alert.leadState.campaign?.name || null,
          renderedMessage: alert.flowStep?.messageTemplate
            ? alert.flowStep.messageTemplate.replace(/\{\{nome\}\}/gi, person?.fullName || 'Doutor(a)')
            : (interactionMap.get(alert.leadStateId) || 'Retorno agendado.')
        };
      });
    }

    // 2. Carrinhos Abandonados (Leads Órfãos)
    // Buscamos quais leads já estão atribuídos a algum operador no SQLite
    const assignedStates = await prisma.leadState.findMany({
      where: { assigneeId: { not: null } },
      select: { externalPersonId: true }
    });
    const assignedIds = assignedStates.map(s => s.externalPersonId);

    let orphanBaseQuery = `
      FROM people p
      WHERE NOT EXISTS (
        SELECT 1 FROM subscriptions s 
        WHERE s.personId = p.id AND s.status = 'active'
      )
    `;
    const orphanParams: any[] = [];

    if (assignedIds.length > 0) {
      orphanBaseQuery += ` AND p.id NOT IN (?)`;
      orphanParams.push(assignedIds);
    }

    if (orphanMonth && orphanMonth !== 'all' && orphanMonth !== '') {
      orphanBaseQuery += ` AND DATE_FORMAT(p.createdAt, '%Y-%m') = ?`;
      orphanParams.push(orphanMonth);
    }

    // Contar total de carrinhos abandonados
    const [countOrphansRows] = await pool.query(`SELECT COUNT(*) as total ${orphanBaseQuery}`, orphanParams);
    const orphanedCount = (countOrphansRows as any[])[0]?.total || 0;

    // Buscar carrinhos abandonados paginados
    const selectOrphansQuery = `
      SELECT p.id, p.fullName, p.email, p.phoneNumber, p.createdAt 
      ${orphanBaseQuery}
      ORDER BY p.createdAt DESC
      LIMIT ? OFFSET ?
    `;
    const [orphans] = await pool.query(selectOrphansQuery, [...orphanParams, orphanLimit, orphanOffset]);
    const orphanedLeads = orphans as any[];

    // 3. Clientes à expirar (Assinaturas expirando nos próximos 30 dias que estão sem operador atribuído)
    // Buscamos quais leads já estão atribuídos a algum operador no SQLite
    const assignedExpiringStates = await prisma.leadState.findMany({
      where: { assigneeId: { not: null } },
      select: { externalPersonId: true }
    });
    const assignedExpiringIds = assignedExpiringStates.map(s => s.externalPersonId);

    let expiringBaseQuery = `
      FROM subscriptions s
      INNER JOIN people p ON s.personId = p.id
      INNER JOIN plans pl ON s.planId = pl.id
      WHERE s.status = 'active'
        AND COALESCE(s.isValidUntil, s.expiresIn) IS NOT NULL
        AND COALESCE(s.isValidUntil, s.expiresIn) >= CURDATE()
        AND COALESCE(s.isValidUntil, s.expiresIn) <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
    `;
    const expiringParams: any[] = [];

    if (assignedExpiringIds.length > 0) {
      expiringBaseQuery += ` AND p.id NOT IN (?)`;
      expiringParams.push(assignedExpiringIds);
    }

    // Contar total de planos expirando
    const [countExpiringRows] = await pool.query(`SELECT COUNT(*) as total ${expiringBaseQuery}`, expiringParams);
    const expiringCount = (countExpiringRows as any[])[0]?.total || 0;

    // Buscar planos expirando paginados
    const selectExpiringQuery = `
      SELECT p.id, p.fullName, p.email, p.phoneNumber, COALESCE(s.isValidUntil, s.expiresIn) as expiresIn, pl.title as planTitle
      ${expiringBaseQuery}
      ORDER BY COALESCE(s.isValidUntil, s.expiresIn) ASC
      LIMIT ? OFFSET ?
    `;
    const [expiringRows] = await pool.query(selectExpiringQuery, [...expiringParams, expiringLimit, expiringOffset]);
    const expiringLeads = expiringRows as any[];

    return NextResponse.json({
      success: true,
      data: {
        taskAlerts: enrichedAlerts,
        orphanedLeads,
        expiringLeads
      },
      pagination: {
        taskAlerts: {
          page: taskPage,
          limit: taskLimit,
          total: taskAlertsCount,
          totalPages: Math.ceil(taskAlertsCount / taskLimit)
        },
        orphanedLeads: {
          page: orphanPage,
          limit: orphanLimit,
          total: orphanedCount,
          totalPages: Math.ceil(orphanedCount / orphanLimit)
        },
        expiringLeads: {
          page: expiringPage,
          limit: expiringLimit,
          total: expiringCount,
          totalPages: Math.ceil(expiringCount / expiringLimit)
        }
      }
    });

  } catch (error: any) {
    console.error('GET alerts error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function checkAndExitCampaignIfLastStep(leadStateId: string, stepId: string | null) {
  if (!stepId) return;

  const step = await prisma.flowStep.findUnique({
    where: { id: stepId },
    include: {
      campaign: {
        include: {
          flowSteps: {
            orderBy: { dayOffset: 'desc' }
          }
        }
      }
    }
  });

  if (!step || !step.campaign || step.campaign.flowSteps.length === 0) return;

  const lastStep = step.campaign.flowSteps[0];
  if (step.id === lastStep.id) {
    await prisma.leadState.update({
      where: { id: leadStateId },
      data: {
        campaignId: null,
        joinedCampaignAt: null
      }
    });

    await prisma.taskAlert.deleteMany({
      where: {
        leadStateId,
        status: 'PENDING'
      }
    });
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

      await checkAndExitCampaignIfLastStep(alert.leadStateId, alert.stepId);

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

    // 4. Atender alerta
    if (action === 'atender') {
      const { alertId } = body;
      if (!alertId) {
        return NextResponse.json({ success: false, error: 'alertId é obrigatório' }, { status: 400 });
      }

      const alert = await prisma.taskAlert.findUnique({
        where: { id: alertId }
      });

      if (!alert) {
        return NextResponse.json({ success: false, error: 'Alerta não encontrado' }, { status: 404 });
      }

      const updatedAlert = await prisma.taskAlert.update({
        where: { id: alertId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          completionNote: 'Atendimento iniciado pelo operador.'
        }
      });

      const updatedLeadState = await prisma.leadState.update({
        where: { id: alert.leadStateId },
        data: {
          stage: 'primeiro_contato'
        }
      });

      await prisma.leadInteraction.create({
        data: {
          leadStateId: alert.leadStateId,
          authorId: userId,
          text: `Iniciou atendimento da campanha. Alerta (${alert.taskType}) marcado como concluído.`
        }
      });

      await checkAndExitCampaignIfLastStep(alert.leadStateId, alert.stepId);

      return NextResponse.json({ success: true, data: { alert: updatedAlert, leadState: updatedLeadState } });
    }

    return NextResponse.json({ success: false, error: 'Ação inválida' }, { status: 400 });

  } catch (error: any) {
    console.error('POST alerts error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

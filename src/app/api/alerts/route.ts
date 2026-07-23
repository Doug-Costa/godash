import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import pool from '@/lib/db';
import { auth } from '@/auth';
import { NotificationService } from '@/lib/services/NotificationService';
import { compileTemplate } from '@/lib/services/providers/MailerProvider';

async function ensureUserExists(userId: string, session: any) {
  const userExists = await prisma.user.findUnique({ where: { id: userId } });
  if (!userExists) {
    await prisma.user.create({
      data: {
        id: userId,
        name: session.user.name || 'Operador',
        email: session.user.email || 'operador@dentalgo.com',
        role: (session.user as any).role || 'AGENT',
        isActive: true
      }
    });
    console.log(`[AutoHeal] Created missing user in Postgres: ${userId}`);
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    await ensureUserExists(userId, session);
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

    // 1. Tasks do Usuário (Prisma - Postgres)
    const taskAlertsCount = await prisma.task.count({
      where: {
        assignedToId: userId,
        status: 'PENDING',
        scheduledFor: { lte: new Date() },
        OR: [
          { customer: { frozenUntil: null } },
          { customer: { frozenUntil: { lt: new Date() } } }
        ]
      }
    });

    const alerts = await prisma.task.findMany({
      where: {
        assignedToId: userId,
        status: 'PENDING',
        scheduledFor: { lte: new Date() },
        OR: [
          { customer: { frozenUntil: null } },
          { customer: { frozenUntil: { lt: new Date() } } }
        ]
      },
      include: {
        customer: {
          include: {
            journey: { select: { name: true } }
          }
        },
        automation: true
      },
      orderBy: { scheduledFor: 'asc' },
      skip: taskOffset,
      take: taskLimit
    });

    // Enriquecer Tasks com dados do MySQL
    let enrichedAlerts: any[] = [];
    if (alerts.length > 0) {
      const personIds = alerts.map(a => a.customer.externalPersonId);
      const [peopleRows] = await pool.query(
        'SELECT id, fullName, email, phoneNumber FROM people WHERE id IN (?)',
        [personIds]
      );
      const peopleMap = new Map((peopleRows as any[]).map(p => [p.id, p]));

      // Buscar última interação para cada cliente para usar de fallback
      const customerIds = alerts.map(a => a.customerId);
      const latestInteractions = await prisma.interaction.findMany({
        where: { customerId: { in: customerIds } },
        orderBy: { createdAt: 'desc' }
      });
      const interactionMap = new Map();
      latestInteractions.forEach(i => {
        if (!interactionMap.has(i.customerId)) {
          interactionMap.set(i.customerId, i.text);
        }
      });

      enrichedAlerts = alerts.map(alert => {
        const person = peopleMap.get(alert.customer.externalPersonId);
        const autoConfig = alert.automation?.actionConfig as any;
        return {
          ...alert,
          leadStateId: alert.customerId, // retrocompatibilidade frontend
          leadState: alert.customer,     // retrocompatibilidade frontend
          flowStep: alert.automation ? {
            id: alert.automation.id,
            dayOffset: autoConfig?.dayOffset || 0,
            channel: autoConfig?.channel || 'WHATSAPP',
            messageTemplate: autoConfig?.messageTemplate || ''
          } : null,
          personName: person?.fullName || 'Cliente Indefinido',
          personEmail: person?.email || '',
          personPhone: person?.phoneNumber || '',
          campaignName: alert.customer.journey?.name || null,
          renderedMessage: autoConfig?.messageTemplate
            ? autoConfig.messageTemplate.replace(/\{\{nome\}\}/gi, person?.fullName || 'Doutor(a)')
            : (interactionMap.get(alert.customerId) || 'Retorno agendado.')
        };
      });
    }

    // 2. Carrinhos Abandonados (Clientes Órfãos)
    const assignedStates = await prisma.customer.findMany({
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

    // 3. Clientes à expirar (sem operador atribuído)
    const assignedExpiringStates = await prisma.customer.findMany({
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

async function checkAndExitCampaignIfLastStep(customerId: string, automationId: string | null) {
  if (!automationId) return;

  const automation = await prisma.automation.findUnique({
    where: { id: automationId },
    include: {
      journey: {
        include: {
          automations: true
        }
      }
    }
  });

  if (!automation || !automation.journey || automation.journey.automations.length === 0) return;

  const sortedAutomations = [...automation.journey.automations].sort((a, b) => {
    const configA = a.actionConfig as any;
    const configB = b.actionConfig as any;
    return (configB?.dayOffset || 0) - (configA?.dayOffset || 0);
  });

  const lastStep = sortedAutomations[0];
  if (automation.id === lastStep.id) {
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        journeyId: null,
        joinedJourneyAt: null
      }
    });

    await prisma.task.deleteMany({
      where: {
        customerId,
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
    await ensureUserExists(userId, session);
    const body = await request.json();
    const { action } = body;

    // 1. Assumir lead órfão
    if (action === 'claim') {
      const { personId } = body;
      if (!personId) {
        return NextResponse.json({ success: false, error: 'personId é obrigatório' }, { status: 400 });
      }

      const vendasPipeline = await prisma.pipeline.findUnique({
        where: { name: 'Vendas' }
      });
      const pipelineId = vendasPipeline?.id || null;

      let customer = await prisma.customer.findFirst({
        where: { externalPersonId: Number(personId), journeyId: null }
      });

      if (customer) {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: {
            assigneeId: userId,
            stage: 'novo_cadastro',
            frozenUntil: null,
            freezeReason: null,
            lostReason: null,
            ...(pipelineId && { pipelineId })
          }
        });
      } else {
        customer = await prisma.customer.create({
          data: {
            externalPersonId: Number(personId),
            journeyId: null,
            assigneeId: userId,
            stage: 'novo_cadastro',
            ...(pipelineId && { pipelineId })
          }
        });
      }

      await prisma.interaction.create({
        data: {
          customerId: customer.id,
          authorId: userId,
          text: 'Assumiu o atendimento deste carrinho abandonado/lead órfão.'
        }
      });

      return NextResponse.json({ success: true, data: customer });
    }

    // 2. Concluir tarefa/alerta
    if (action === 'complete') {
      const { alertId, note } = body;
      if (!alertId) {
        return NextResponse.json({ success: false, error: 'alertId é obrigatório' }, { status: 400 });
      }

      const task = await prisma.task.update({
        where: { id: alertId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          completionNote: note || ''
        }
      });

      await prisma.interaction.create({
        data: {
          customerId: task.customerId,
          authorId: userId,
          text: `Tarefa concluída (${task.taskType}): ${note || 'Sem observações.'}`
        }
      });

      await checkAndExitCampaignIfLastStep(task.customerId, task.automationId);

      return NextResponse.json({ success: true, data: task });
    }

    // 3. Pular tarefa/alerta
    if (action === 'skip') {
      const { alertId, note } = body;
      if (!alertId) {
        return NextResponse.json({ success: false, error: 'alertId é obrigatório' }, { status: 400 });
      }

      const task = await prisma.task.update({
        where: { id: alertId },
        data: {
          status: 'SKIPPED',
          completedAt: new Date(),
          completionNote: note || ''
        }
      });

      await prisma.interaction.create({
        data: {
          customerId: task.customerId,
          authorId: userId,
          text: `Tarefa pulada/remarcada (${task.taskType}): ${note || 'Sem observações.'}`
        }
      });

      return NextResponse.json({ success: true, data: task });
    }

    // 4. Atender alerta/tarefa
    if (action === 'atender') {
      const { alertId } = body;
      if (!alertId) {
        return NextResponse.json({ success: false, error: 'alertId é obrigatório' }, { status: 400 });
      }

      const task = await prisma.task.findUnique({
        where: { id: alertId },
        include: {
          automation: true,
          customer: true,
        }
      });

      if (!task) {
        return NextResponse.json({ success: false, error: 'Tarefa não encontrada' }, { status: 404 });
      }

      // Buscar os detalhes do cliente no MySQL
      const [personRows] = await pool.query(
        'SELECT id, fullName, email, phoneNumber FROM people WHERE id = ? LIMIT 1',
        [task.customer.externalPersonId]
      );
      const person = (personRows as any[])[0];

      let msgSentLog = 'Atendimento iniciado pelo operador.';
      if (person) {
        const automation = task.automation;
        const template = automation?.templateId
          ? await prisma.template.findUnique({ where: { id: automation.templateId } })
          : null;

        const actionConfig = (automation?.actionConfig as any) || {};
        const templateMessage = actionConfig.templateMessage || 'Olá {{nome}}! Como podemos ajudar?';

        const variables = {
          customer: {
            fullName: person.fullName || 'Doutor(a)',
            name: person.fullName || 'Doutor(a)',
            email: person.email || '',
            phone: person.phoneNumber || '',
            plan: task.snapshotPlanName || '',
          },
          nome: person.fullName || 'Doutor(a)',
          email: person.email || '',
          telefone: person.phoneNumber || '',
          plano: task.snapshotPlanName || '',
        };

        const renderedText = template
          ? compileTemplate(template.content, variables)
          : compileTemplate(templateMessage, variables);

        let waSuccess = false;
        let emailSuccess = false;

        // Disparar WhatsApp se houver telefone
        if (person.phoneNumber) {
          waSuccess = await NotificationService.sendWhatsApp(person.phoneNumber, renderedText);
        }

        // Disparar E-mail se houver email
        if (person.email) {
          const emailSubject = template?.subject
            ? compileTemplate(template.subject, variables)
            : `DentalGO - ${automation?.name || 'Atendimento'}`;
          emailSuccess = await NotificationService.sendEmail(person.email, emailSubject, renderedText);
        }

        msgSentLog = `Atendimento iniciado. Notificações disparadas: WhatsApp (${waSuccess ? 'Sucesso' : 'Falha/Não enviado'}), E-mail (${emailSuccess ? 'Sucesso' : 'Falha/Não enviado'}).`;
      }

      const updatedTask = await prisma.task.update({
        where: { id: alertId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          completionNote: msgSentLog
        }
      });

      const updatedCustomer = await prisma.customer.update({
        where: { id: task.customerId },
        data: {
          stage: 'primeiro_contato'
        }
      });

      await prisma.interaction.create({
        data: {
          customerId: task.customerId,
          authorId: userId,
          text: `Iniciou atendimento da campanha. ${msgSentLog}`
        }
      });

      await checkAndExitCampaignIfLastStep(task.customerId, task.automationId);

      return NextResponse.json({ success: true, data: { alert: updatedTask, leadState: updatedCustomer } });
    }

    return NextResponse.json({ success: false, error: 'Ação inválida' }, { status: 400 });

  } catch (error: any) {
    console.error('POST alerts error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { PrismaCrmRepository } from '@/lib/repositories/PrismaCrmRepository';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

const crmRepository = new PrismaCrmRepository();

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

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const role = (session.user as any).role || 'AGENT';
    const userId = session.user.id;
    await ensureUserExists(userId, session);
    const isAgent = role === 'AGENT' || role === 'POST_SALES';

    const customers = await prisma.customer.findMany({
      where: isAgent ? { assigneeId: userId } : undefined,
      include: {
        interactions: {
          include: {
            author: {
              select: { name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (customers.length === 0) {
      return NextResponse.json({ success: true, data: {} });
    }

    const ids = customers.map((c) => c.externalPersonId);
    const [peopleRows] = await pool.query(
      'SELECT id, email FROM people WHERE id IN (?)',
      [ids]
    );

    const emailMap = new Map<number, string>();
    (peopleRows as any[]).forEach((row) => {
      emailMap.set(row.id, row.email);
    });

    const data: Record<string, any> = {};
    customers.forEach((c) => {
      const email = emailMap.get(c.externalPersonId) || `lead_${c.externalPersonId}@dentalgo.com`;
      data[email] = {
        stage: c.stage,
        assigneeId: c.assigneeId,
        notes: c.interactions.map((i) => ({
          date: i.createdAt.toISOString(),
          text: i.text,
          authorName: i.author?.name || 'Agente',
        })),
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('CRM GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { emailOrId, stage, note, assigneeId, journeyId } = body;

    if (!emailOrId) {
      return NextResponse.json({ success: false, error: 'emailOrId is required' }, { status: 400 });
    }

    const resolvedJourneyId = journeyId || null;

    let externalPersonId: number;
    const isNum = !isNaN(Number(emailOrId));

    const [personRows] = await pool.query(
      'SELECT id, email FROM people WHERE email = ? OR id = ? LIMIT 1',
      [emailOrId, isNum ? Number(emailOrId) : -1]
    );

    const person = (personRows as any[])[0];
    if (!person) {
      return NextResponse.json({ success: false, error: 'Lead not found in core database' }, { status: 404 });
    }
    externalPersonId = person.id;

    const session = await auth();
    let authorId = (session?.user as any)?.id;
    if (authorId) {
      await ensureUserExists(authorId, session);
    }

    if (!authorId) {
      let agent = await prisma.user.findFirst();
      if (!agent) {
        agent = await prisma.user.create({
          data: {
            name: 'System Agent',
            email: 'agent@dentalgo.com',
            role: 'ADMIN',
          },
        });
      }
      authorId = agent.id;
    }

    if (stage) {
      await crmRepository.updateStage(externalPersonId, stage, resolvedJourneyId);
    }

    if (note) {
      await crmRepository.addInteraction(externalPersonId, note, authorId, resolvedJourneyId);
    }

    if (assigneeId !== undefined) {
      await crmRepository.assignLead(externalPersonId, assigneeId, resolvedJourneyId);
    }

    const customer = await prisma.customer.findFirst({
      where: { externalPersonId, journeyId: resolvedJourneyId }
    });

    // Fetch all customer records for this externalPersonId to construct unified notes, tasks, and campaigns
    const allStates = await prisma.customer.findMany({
      where: { externalPersonId },
      include: {
        interactions: {
          include: {
            author: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        journey: {
          select: { name: true }
        },
        tasks: {
          include: {
            assignedTo: { select: { name: true } }
          }
        }
      }
    });

    const unifiedNotes: any[] = [];
    allStates.forEach(cust => {
      // Gather interactions
      (cust.interactions || []).forEach((i: any) => {
        unifiedNotes.push({
          date: i.createdAt.toISOString(),
          text: i.text,
          authorName: i.author?.name || 'Agente',
        });
      });
      // Gather campaigns
      if (cust.journeyId) {
        unifiedNotes.push({
          date: (cust.joinedJourneyAt || cust.createdAt).toISOString(),
          text: `🎯 Participando da campanha/esteira comercial: "${cust.journey?.name || 'Campanha'}" (Início em ${cust.joinedJourneyAt ? cust.joinedJourneyAt.toLocaleDateString('pt-BR') : cust.createdAt.toLocaleDateString('pt-BR')})`,
          authorName: 'Sistema',
        });
      }
      // Gather tasks
      (cust.tasks || []).forEach((t: any) => {
        let taskTypeLabel = 'Compromisso';
        if (t.taskType === 'RETORNO') taskTypeLabel = 'Retorno Agendado';
        else if (t.taskType === 'WHATSAPP') taskTypeLabel = 'Mensagem de WhatsApp';
        else if (t.taskType === 'EMAIL') taskTypeLabel = 'Envio de E-mail';
        
        let statusText = '';
        if (t.status === 'PENDING') {
          statusText = `📅 [Agendado] ${taskTypeLabel} marcado para ${t.scheduledFor.toLocaleString('pt-BR')}${t.assignedTo ? ` (Responsável: ${t.assignedTo.name})` : ''}`;
        } else if (t.status === 'COMPLETED') {
          statusText = `✅ [Cumprido] ${taskTypeLabel} realizado em ${t.completedAt ? t.completedAt.toLocaleString('pt-BR') : t.updatedAt.toLocaleString('pt-BR')}${t.completionNote ? `. Obs: "${t.completionNote}"` : ''}`;
        } else {
          statusText = `❌ [Cancelado/Ignorado] ${taskTypeLabel}. Status: ${t.status}`;
        }

        unifiedNotes.push({
          date: (t.completedAt || t.scheduledFor || t.updatedAt).toISOString(),
          text: statusText,
          authorName: t.assignedTo?.name || 'Agente',
        });
      });
    });

    // Sort notes descending
    unifiedNotes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const formattedData = {
      stage: customer?.stage || 'novo_cadastro',
      assigneeId: customer?.assigneeId || null,
      notes: unifiedNotes,
    };

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error: any) {
    console.error('CRM POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

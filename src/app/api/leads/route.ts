import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import prisma from '@/lib/prisma';
import { PrismaCrmRepository } from '@/lib/repositories/PrismaCrmRepository';
import { auth } from '@/auth';
import { RegisterLeadInteractionService } from '@/lib/application/RegisterLeadInteractionService';
import { LeadTaggingService } from '@/lib/application/LeadTaggingService';

const crmRepository = new PrismaCrmRepository();

export async function GET(request: Request) {
  const session = await auth();
  if (!session || !session.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const role = (session.user as any).role || 'AGENT';
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month'); // YYYY-MM
  const plan = searchParams.get('plan'); // planId or 'none'
  const search = searchParams.get('search'); // name/email
  const stage = searchParams.get('stage'); // crm stage
  const assigneeId = searchParams.get('assigneeId'); // agent user id or 'unassigned'
  const lossReason = searchParams.get('lossReason');
  const tag = searchParams.get('tag');
  const leadId = searchParams.get('leadId');
  const pipelineId = searchParams.get('pipelineId');

  const targetMonth = !month || month === 'all' ? new Date().toISOString().slice(0, 7) : month;

  try {
    let query = `
      SELECT 
        p.id, 
        p.fullName, 
        p.email, 
        p.phoneNumber, 
        p.createdAt,
        pl.id as planId,
        pl.title as planTitle,
        pl.price as planPrice,
        pl.intervalType as planInterval
      FROM people p
      LEFT JOIN subscriptions s ON s.personId = p.id 
        AND s.createdAt <= LAST_DAY(CONCAT(?, '-01')) 
        AND (s.canceledAt IS NULL OR s.canceledAt > LAST_DAY(CONCAT(?, '-01')))
      LEFT JOIN plans pl ON s.planId = pl.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // 1. Filter by CRM state from Postgres (stage, assignee, lossReason, tag)
    const hasStage = stage && stage !== '';
    const hasAssignee = assigneeId && assigneeId !== 'all';
    const hasLossReason = lossReason && lossReason !== 'all' && lossReason !== '';
    const hasTag = tag && tag !== 'all' && tag !== '';

    const isAgent = role === 'AGENT' || role === 'POST_SALES';

    if (isAgent && leadId) {
      // Agente consultando um lead específico: verificar se pertence a outro agente
      const cust = await prisma.customer.findUnique({
        where: { externalPersonId: Number(leadId) }
      });
      if (cust && cust.assigneeId && cust.assigneeId !== userId) {
        return NextResponse.json({ success: true, data: [] });
      }
    }

    if (!leadId) {
      const crmFilter: any = {};
      if (isAgent) {
        crmFilter.assigneeId = userId;
      } else if (hasAssignee) {
        crmFilter.assigneeId = assigneeId === 'unassigned' ? null : assigneeId;
      }

      if (hasStage) crmFilter.stage = stage;
      if (hasLossReason) crmFilter.lossReason = lossReason;
      if (hasTag) crmFilter.tag = tag;

      const hasPipeline = pipelineId && pipelineId !== 'all';
      if (hasPipeline) {
        crmFilter.pipelineId = pipelineId;
      }

      if (isAgent || hasStage || hasAssignee || hasLossReason || hasTag || hasPipeline) {
        const matchingStates = await prisma.customer.findMany({
          where: crmFilter,
          select: { externalPersonId: true }
        });
        
        const matchingIds = matchingStates.map(s => s.externalPersonId);
        if (matchingIds.length === 0) {
          return NextResponse.json({ success: true, data: [] });
        }
        
        query += ` AND p.id IN (?)`;
        params.push(matchingIds);
      }
    }

    // 2. Filter by date/month (MySQL)
    if (month && month !== 'all' && !leadId) {
      query += ` AND DATE_FORMAT(p.createdAt, '%Y-%m') = ?`;
      params.push(month);
    }

    // Filter by leadId directly if provided (MySQL)
    if (leadId) {
      query += ` AND p.id = ?`;
      params.push(Number(leadId));
    }

    // 3. Filter by plan (MySQL)
    if (plan) {
      if (plan === 'none') {
        query += ` AND pl.id IS NULL`;
      } else {
        query += ` AND pl.id = ?`;
        params.push(Number(plan));
      }
    }

    // 4. Filter by name/email/phone (MySQL)
    if (search) {
      query += ` AND (p.fullName LIKE ? OR p.email LIKE ? OR p.phoneNumber LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY p.createdAt DESC LIMIT 1000`;

    const [rows] = await pool.query(query, [targetMonth, targetMonth, ...params]);
    const personIds = (rows as any[]).map(r => r.id);

    if (personIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Fetch corresponding states, interactions, campaign and alerts from Postgres
    const customers = await prisma.customer.findMany({
      where: {
        externalPersonId: { in: personIds }
      },
      include: {
        interactions: {
          include: {
            author: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        assignee: {
          select: { id: true, name: true }
        },
        journey: {
          select: { id: true, name: true }
        },
        tasks: {
          where: { status: 'PENDING' }
        }
      }
    });

    const stateMap = new Map();
    customers.forEach(c => {
      stateMap.set(c.externalPersonId, c);
    });

    const data = (rows as any[]).map(r => {
      const state = stateMap.get(r.id);
      return {
        id: r.id,
        fullName: r.fullName || 'Sem Nome',
        email: r.email || '',
        phoneNumber: r.phoneNumber || '',
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        plan: r.planId ? {
          id: r.planId,
          title: r.planTitle,
          price: r.planPrice,
          interval: r.planInterval
        } : null,
        stage: state?.stage || 'novo_cadastro',
        tag: state?.tag || null,
        assignee: state?.assignee ? {
          id: state.assignee.id,
          name: state.assignee.name
        } : null,
        campaign: state?.journey ? {
          id: state.journey.id,
          name: state.journey.name
        } : null,
        hasPendingAlert: (state?.tasks || []).length > 0,
        notes: (state?.interactions || []).map((i: any) => ({
          id: i.id,
          text: i.text,
          date: i.createdAt ? new Date(i.createdAt).toISOString() : new Date().toISOString(),
          authorName: i.author?.name || 'Agente',
          type: inferInteractionType(i.text)
        })),
        metadata: state?.metadata || {}
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Leads GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    let authorId = (session?.user as any)?.id;

    if (!authorId) {
      // Fallback for system agent if no logged-in session exists
      let agent = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      if (!agent) {
        const hashedPassword = await bcryptHash('admin123');
        agent = await prisma.user.create({
          data: {
            name: 'Administrador DentalGO',
            email: 'admin@dentalgo.com',
            password: hashedPassword,
            role: 'ADMIN',
          }
        });
      }
      authorId = agent.id;
    }

    const body = await request.json();
    const { leadId, stage, note, assigneeId, type, lossReason, scheduledFor, tag, lostReason, metadata } = body;

    if (!leadId) {
      return NextResponse.json({ success: false, error: 'leadId is required' }, { status: 400 });
    }

    const externalPersonId = Number(leadId);

    // 1. Register Quick action/Interaction if type provided
    if (type) {
      if (type === 'MEETING_SCHEDULED' && !scheduledFor) {
        return NextResponse.json({ success: false, error: 'scheduledFor (data de retorno) is required for MEETING_SCHEDULED' }, { status: 400 });
      }

      const parsedScheduledFor = scheduledFor ? new Date(scheduledFor) : undefined;

      const registerService = new RegisterLeadInteractionService(crmRepository);
      await registerService.execute(externalPersonId, authorId, type, note, lossReason, parsedScheduledFor);

      // Auto tag the lead
      const taggingService = new LeadTaggingService(crmRepository);
      await taggingService.tagLead(externalPersonId);
    } else {
      // Manual updates fallback (old behavior)
      if (stage) {
        await crmRepository.updateStage(externalPersonId, stage);
        
        if (stage === 'ganho' || stage === 'perdido') {
          const customer = await prisma.customer.findUnique({
            where: { externalPersonId }
          });
          if (customer) {
            await prisma.customer.update({
              where: { externalPersonId },
              data: {
                journeyId: null,
                joinedJourneyAt: null,
                frozenUntil: null,
                freezeReason: null
              }
            });
            await prisma.task.deleteMany({
              where: {
                customerId: customer.id,
                status: 'PENDING'
              }
            });
          }
        }
      }
      if (note && note.trim() !== '') {
        await crmRepository.addInteraction(externalPersonId, note, authorId);
      }
    }

    // Explicit tag update if provided
    if (tag) {
      await crmRepository.updateCustomer(externalPersonId, { tag });
    }

    if (lostReason !== undefined) {
      await prisma.customer.update({
        where: { externalPersonId },
        data: { lostReason }
      });
    }

    if (metadata !== undefined) {
      const customer = await prisma.customer.upsert({
        where: { externalPersonId },
        update: {},
        create: { externalPersonId, stage: 'novo_cadastro' }
      });
      const currentMeta = (customer.metadata as Record<string, any>) || {};
      const newMeta = { ...currentMeta, ...metadata };
      await prisma.customer.update({
        where: { externalPersonId },
        data: { metadata: newMeta }
      });
    }

    // 2. Assign Lead if provided (separate from quick disposition)
    if (assigneeId !== undefined) {
      await crmRepository.assignLead(externalPersonId, assigneeId === 'unassigned' || !assigneeId ? null : assigneeId);
    }

    // Fetch the updated customer state to return
    const updatedState = await prisma.customer.findUnique({
      where: { externalPersonId },
      include: {
        interactions: {
          include: {
            author: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        assignee: {
          select: { id: true, name: true }
        }
      }
    });

    const formattedData = {
      leadId: externalPersonId,
      stage: updatedState?.stage || 'novo_cadastro',
      tag: updatedState?.tag || null,
      assignee: updatedState?.assignee ? {
        id: updatedState.assignee.id,
        name: updatedState.assignee.name
      } : null,
      notes: (updatedState?.interactions || []).map((i: any) => ({
        id: i.id,
        text: i.text,
        date: i.createdAt.toISOString(),
        authorName: i.author?.name || 'Agente',
        type: inferInteractionType(i.text)
      })),
      metadata: updatedState?.metadata || {}
    };

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error: any) {
    console.error('Leads POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Utility function to hash password in case of fallback creation
async function bcryptHash(password: string): Promise<string> {
  const bcrypt = require('bcryptjs');
  return bcrypt.hash(password, 10);
}

function inferInteractionType(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('congelado') || t.includes('congelar')) return 'FREEZE';
  if (t.includes('descongelado') || t.includes('descongelar')) return 'UNFREEZE';
  if (t.includes('motivo:') || t.includes('perdido') || t.includes('descarte')) return 'LOST';
  if (t.includes('ganho') || t.includes('recuperado')) return 'RECOVERED';
  if (t.includes('retorno agendado') || t.includes('remarcada') || t.includes('agendamento')) return 'MEETING_SCHEDULED';
  if (t.includes('iniciou atendimento') || t.includes('contato feito')) return 'CONTACT_ATTEMPT';
  if (t.includes('sistema')) return 'SYSTEM_LOG';
  return 'NOTE';
}

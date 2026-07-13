import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { PrismaCrmRepository } from '@/lib/repositories/PrismaCrmRepository';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

const crmRepository = new PrismaCrmRepository();

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const role = (session.user as any).role || 'AGENT';
    const userId = session.user.id;
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
    const { emailOrId, stage, note, assigneeId } = body;

    if (!emailOrId) {
      return NextResponse.json({ success: false, error: 'emailOrId is required' }, { status: 400 });
    }

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
      await crmRepository.updateStage(externalPersonId, stage);
    }

    if (note) {
      await crmRepository.addInteraction(externalPersonId, note, authorId);
    }

    if (assigneeId !== undefined) {
      await crmRepository.assignLead(externalPersonId, assigneeId);
    }

    const customer = await prisma.customer.findUnique({
      where: { externalPersonId },
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

    const formattedData = {
      stage: customer?.stage || 'novo_cadastro',
      assigneeId: customer?.assigneeId || null,
      notes: ((customer as any)?.interactions || []).map((i: any) => ({
        date: i.createdAt.toISOString(),
        text: i.text,
        authorName: i.author?.name || 'Agente',
      })),
    };

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error: any) {
    console.error('CRM POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

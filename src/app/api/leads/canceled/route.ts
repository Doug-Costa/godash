import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: Request) {
  try {
    // 1. Authenticate and authorize role
    const session = await auth();
    const role = (session?.user as any)?.role;

    if (role !== 'ADMIN') {
      return new Response('Acesso negado: apenas administradores possuem acesso a esta lista.', { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // YYYY-MM
    const plan = searchParams.get('plan'); // planId
    const search = searchParams.get('search'); // name/email
    const format = searchParams.get('format') || 'json';
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.max(1, Number(searchParams.get('limit') || 10));
    const offset = (page - 1) * limit;

    // We fetch users whose subscription is 'canceled' and who do not currently have any active subscription
    let query = `
      FROM subscriptions s
      INNER JOIN people p ON s.personId = p.id
      INNER JOIN plans pl ON s.planId = pl.id
      WHERE s.status = 'canceled'
        AND NOT EXISTS (
          SELECT 1 FROM subscriptions s2
          WHERE s2.personId = p.id AND s2.status = 'active'
        )
    `;
    const params: any[] = [];

    // Filter by month of cancellation (s.canceledAt)
    if (month && month !== 'all' && month !== '') {
      query += ` AND DATE_FORMAT(s.canceledAt, '%Y-%m') = ?`;
      params.push(month);
    }

    // Filter by plan
    if (plan && plan !== 'all') {
      query += ` AND pl.id = ?`;
      params.push(Number(plan));
    }

    // Filter by name/email
    if (search) {
      query += ` AND (p.fullName LIKE ? OR p.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    // For CSV, we get all records without pagination
    if (format === 'csv') {
      const selectQuery = `
        SELECT 
          p.id, 
          p.fullName, 
          p.email, 
          p.phoneNumber, 
          s.canceledAt, 
          s.createdAt as subscriptionStart,
          pl.title as planTitle, 
          pl.price as planPrice
        ${query}
        ORDER BY s.canceledAt DESC
      `;
      const [rows] = await pool.query(selectQuery, params);
      const data = rows as any[];

      // Fetch CRM stages from Postgres for these people to include in report
      const personIds = data.map(r => r.id);
      let stateMap = new Map();
      if (personIds.length > 0) {
        const customers = await prisma.customer.findMany({
          where: { externalPersonId: { in: personIds } },
          include: { assignee: { select: { name: true } } }
        });
        customers.forEach(c => stateMap.set(c.externalPersonId, c));
      }

      const csvHeaders = "ID,Nome Completo,Email,Telefone,Data Cancelamento,Inicio Assinatura,Plano Cancelado,Preco,Estagio CRM,Responsavel\n";
      const csvRows = data.map(r => {
        const state = stateMap.get(r.id);
        const name = (r.fullName || 'Sem Nome').replace(/"/g, '""');
        const email = r.email || '';
        const phone = r.phoneNumber || '';
        const canceledDate = r.canceledAt ? new Date(r.canceledAt).toISOString().slice(0, 10) : '';
        const startDate = r.subscriptionStart ? new Date(r.subscriptionStart).toISOString().slice(0, 10) : '';
        const planTitle = r.planTitle ? r.planTitle.replace(/"/g, '""') : '';
        const price = r.planPrice ? (r.planPrice / 100).toFixed(2) : '0.00';
        const stage = state?.stage || 'novo_cadastro';
        const agent = state?.assignee?.name || 'Sem responsavel';

        return `"${r.id}","${name}","${email}","${phone}","${canceledDate}","${startDate}","${planTitle}","${price}","${stage}","${agent}"`;
      }).join('\n');

      return new Response(csvHeaders + csvRows, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename=leads_cancelados_${month || 'geral'}.csv`
        }
      });
    }

    // Otherwise, paginated JSON
    const countQuery = `SELECT COUNT(*) as total ${query}`;
    const [countRows] = await pool.query(countQuery, params);
    const total = (countRows as any[])[0]?.total || 0;

    const selectQuery = `
      SELECT 
        p.id, 
        p.fullName, 
        p.email, 
        p.phoneNumber, 
        s.canceledAt, 
        s.createdAt as subscriptionStart,
        pl.id as planId,
        pl.title as planTitle, 
        pl.price as planPrice,
        pl.intervalType as planInterval
      ${query}
      ORDER BY s.canceledAt DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(selectQuery, [...params, limit, offset]);
    const data = rows as any[];
    const personIds = data.map(r => r.id);

    // Fetch corresponding states and interactions from Postgres
    let stateMap = new Map();
    if (personIds.length > 0) {
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
          }
        }
      });
      customers.forEach(c => {
        stateMap.set(c.externalPersonId, c);
      });
    }

    const formattedData = data.map(r => {
      const state = stateMap.get(r.id);
      return {
        id: r.id,
        fullName: r.fullName || 'Sem Nome',
        email: r.email || '',
        phoneNumber: r.phoneNumber || '',
        canceledAt: r.canceledAt ? new Date(r.canceledAt).toISOString() : null,
        createdAt: r.subscriptionStart ? new Date(r.subscriptionStart).toISOString() : null,
        plan: {
          id: r.planId,
          title: r.planTitle,
          price: r.planPrice,
          interval: r.planInterval
        },
        stage: state?.stage || 'novo_cadastro',
        tag: state?.tag || null,
        assignee: state?.assignee ? {
          id: state.assignee.id,
          name: state.assignee.name
        } : null,
        notes: (state?.interactions || []).map((i: any) => ({
          id: i.id,
          text: i.text,
          date: i.createdAt ? new Date(i.createdAt).toISOString() : new Date().toISOString(),
          authorName: i.author?.name || 'Agente'
        }))
      };
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: formattedData,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });

  } catch (error: any) {
    console.error('Canceled leads GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || 'all';
    const planId = searchParams.get('planId') || 'all';
    const subscriptionStatus = searchParams.get('subscriptionStatus') || 'all';
    const productId = searchParams.get('productId') || 'all';
    const journeyId = searchParams.get('journeyId') || 'all';
    const assigneeId = searchParams.get('assigneeId') || 'all';
    const stage = searchParams.get('stage') || 'all';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);

    const offset = (page - 1) * limit;

    // 1. Fetch matching person IDs from MySQL if DentalGO or sub filter is active
    let mysqlLeadMap = new Map<number, any>();

    if (source === 'all' || source === 'DENTALGO' || planId !== 'all' || subscriptionStatus !== 'all') {
      try {
        let sql = `
          SELECT 
            p.id,
            COALESCE(NULLIF(p.fullName, ''), p.email, CONCAT('Lead DentalGO #', p.id)) AS fullName,
            p.email,
            p.phoneNumber AS phone,
            p.createdAt,
            s.id AS subId,
            s.planId,
            pl.title AS planTitle,
            s.status AS subStatus,
            s.createdAt AS subCreatedAt,
            s.isValidUntil
          FROM people p
          LEFT JOIN subscriptions s ON s.personId = p.id
          LEFT JOIN plans pl ON s.planId = pl.id
          WHERE p.admin = 0
        `;
        const params: any[] = [];

        if (search) {
          sql += ` AND (LOWER(COALESCE(p.fullName, '')) LIKE ? OR LOWER(p.email) LIKE ? OR p.phoneNumber LIKE ?)`;
          const sTerm = `%${search.toLowerCase()}%`;
          params.push(sTerm, sTerm, `%${search}%`);
        }

        if (planId !== 'all' && planId !== 'no_plan') {
          sql += ` AND pl.id = ?`;
          params.push(planId);
        }

        if (subscriptionStatus !== 'all') {
          const st = subscriptionStatus.toLowerCase();
          if (st === 'active') {
            sql += ` AND s.status = 'active'`;
          } else if (st === 'canceled') {
            sql += ` AND s.status = 'canceled'`;
          } else if (st === 'expired') {
            sql += ` AND (s.status = 'expired' OR (s.status = 'active' AND COALESCE(s.isValidUntil, s.expiresIn) < CURDATE()))`;
          } else if (st === 'no_plan') {
            sql += ` AND (s.id IS NULL OR s.status = 'pending')`;
          }
        }

        if (startDate) {
          sql += ` AND p.createdAt >= ?`;
          params.push(new Date(startDate));
        }

        if (endDate) {
          sql += ` AND p.createdAt <= ?`;
          params.push(new Date(`${endDate}T23:59:59.999Z`));
        }

        sql += ` ORDER BY p.createdAt DESC LIMIT 2000`;

        const [rows]: any = await pool.query(sql, params);
        for (const row of rows) {
          if (!mysqlLeadMap.has(row.id)) {
            mysqlLeadMap.set(row.id, {
              externalPersonId: row.id,
              name: row.fullName || 'Lead DentalGO',
              email: row.email || '',
              phone: row.phone || '',
              source: 'DentalGO Sinc DB',
              planId: row.planId || null,
              planTitle: row.planTitle || (row.planId ? row.planId : 'Sem Plano / Pendente'),
              subscriptionStatus: row.subStatus || (row.planId ? 'active' : 'no_plan'),
              createdAt: row.createdAt,
              isValidUntil: row.isValidUntil
            });
          }
        }
      } catch (dbErr) {
        console.warn('[Explorer API] MySQL query bypassed/timed out:', dbErr);
      }
    }

    // 2. Fetch customers from Prisma CDP
    const prismaWhere: any = {};

    if (search) {
      prismaWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (source !== 'all') {
      if (source === 'DENTALGO') {
        prismaWhere.source = 'DENTALGO';
      } else if (source.startsWith('Form Capture: ')) {
        const formTitle = source.replace('Form Capture: ', '');
        prismaWhere.source = { contains: formTitle, mode: 'insensitive' };
      } else if (source.includes('Form')) {
        prismaWhere.source = { contains: 'Form', mode: 'insensitive' };
      } else if (source === 'CSV') {
        prismaWhere.source = 'CSV';
      }
    }

    // Filter Prisma Customers when planId or subscriptionStatus is specified
    if (planId !== 'all' || subscriptionStatus !== 'all') {
      const validPersonIds = Array.from(mysqlLeadMap.keys());
      const subConds: any[] = [];

      if (validPersonIds.length > 0) {
        subConds.push({ externalPersonId: { in: validPersonIds } });
      }

      const cpWhere: any = {};
      if (planId !== 'all' && planId !== 'no_plan') cpWhere.productId = planId;
      if (subscriptionStatus === 'active') cpWhere.status = 'ACTIVE';
      else if (subscriptionStatus === 'expired') cpWhere.status = 'EXPIRED';
      else if (subscriptionStatus === 'canceled') cpWhere.status = 'CANCELED';

      if (subscriptionStatus === 'no_plan' || planId === 'no_plan') {
        subConds.push({ customerProducts: { none: {} } });
      } else if (Object.keys(cpWhere).length > 0) {
        subConds.push({ customerProducts: { some: cpWhere } });
      }

      if (subConds.length > 0) {
        prismaWhere.AND = [
          ...(prismaWhere.AND || []),
          { OR: subConds }
        ];
      }
    }

    if (journeyId !== 'all') {
      if (journeyId === 'none') prismaWhere.journeyId = null;
      else prismaWhere.journeyId = journeyId;
    }

    if (assigneeId !== 'all') {
      if (assigneeId === 'unassigned') prismaWhere.assigneeId = null;
      else prismaWhere.assigneeId = assigneeId;
    }

    if (stage !== 'all') {
      prismaWhere.stage = stage;
    }

    if (startDate || endDate) {
      const dateCond: any = {};
      if (startDate) dateCond.gte = new Date(startDate);
      if (endDate) dateCond.lte = new Date(`${endDate}T23:59:59.999Z`);
      prismaWhere.createdAt = dateCond;
    }

    const prismaCustomers = await prisma.customer.findMany({
      where: prismaWhere,
      include: {
        person: true,
        assignee: { select: { id: true, name: true, email: true } },
        journey: { select: { id: true, name: true } },
        customerProducts: {
          include: { product: { select: { id: true, name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 2000
    });

    // Enrich missing contact details from MySQL people table for externalPersonIds in Prisma
    const missingExtIds = (prismaCustomers as any[])
      .filter(c => c.externalPersonId && !mysqlLeadMap.has(c.externalPersonId))
      .map(c => c.externalPersonId);

    if (missingExtIds.length > 0) {
      try {
        const idsStr = missingExtIds.join(',');
        const [extraPeople]: any = await pool.query(`
          SELECT 
            p.id,
            COALESCE(NULLIF(p.fullName, ''), p.email, CONCAT('Dr. Lead #', p.id)) AS fullName,
            p.email,
            p.phoneNumber AS phone,
            p.createdAt
          FROM people p
          WHERE p.id IN (${idsStr})
        `);
        for (const r of extraPeople) {
          mysqlLeadMap.set(r.id, {
            externalPersonId: r.id,
            name: r.fullName,
            email: r.email || '',
            phone: r.phone || '',
            source: 'DentalGO Sinc DB',
            planTitle: 'Sem Plano / Pendente',
            subscriptionStatus: 'no_plan',
            createdAt: r.createdAt
          });
        }
      } catch (err) {
        console.warn('[Explorer API] Extra people enrichment failed:', err);
      }
    }

    // 3. Merge MySQL and Prisma leads
    const combinedLeadsMap = new Map<string, any>();

    // Add MySQL leads
    for (const [pId, mLead] of mysqlLeadMap.entries()) {
      const key = `ext_${pId}`;
      combinedLeadsMap.set(key, {
        id: `ext_${pId}`,
        externalPersonId: pId,
        name: mLead.name,
        email: mLead.email,
        phone: mLead.phone,
        source: mLead.source,
        planTitle: mLead.planTitle,
        subscriptionStatus: mLead.subscriptionStatus,
        courses: [],
        journeyId: null,
        journeyName: 'Fora de Campanha',
        assigneeId: null,
        assigneeName: 'Não Atribuído',
        stage: 'novo_cadastro',
        createdAt: mLead.createdAt
      });
    }

    // Overlay Prisma leads
    for (const c of prismaCustomers as any[]) {
      const key = c.externalPersonId ? `ext_${c.externalPersonId}` : c.id;
      const existing = combinedLeadsMap.get(key) || {};

      const courses = c.customerProducts?.map((cp: any) => cp.product.name) || [];
      const planFromPrisma = c.customerProducts?.[0]?.product?.name;
      const statusFromPrisma = c.customerProducts?.[0]?.status?.toLowerCase();

      combinedLeadsMap.set(key, {
        id: c.id,
        externalPersonId: c.externalPersonId || existing.externalPersonId || null,
        name: existing.name || c.person?.fullName || (c.person?.email ? c.person.email.split('@')[0] : null) || `Lead #${c.externalPersonId || c.id}`,
        email: existing.email || c.person?.email || '',
        phone: existing.phone || c.person?.phoneNumber || '',
        source: existing.source || c.source || 'Form Capture / CDP',
        planTitle: existing.planTitle || planFromPrisma || 'Sem Plano / Pendente',
        subscriptionStatus: existing.subscriptionStatus || statusFromPrisma || 'no_plan',
        courses: Array.from(new Set([...(existing.courses || []), ...courses])),
        journeyId: c.journeyId || existing.journeyId || null,
        journeyName: c.journey?.name || existing.journeyName || 'Fora de Campanha',
        assigneeId: c.assigneeId || existing.assigneeId || null,
        assigneeName: c.assignee?.name || existing.assigneeName || 'Não Atribuído',
        stage: c.stage || existing.stage || 'novo_cadastro',
        createdAt: c.createdAt || existing.createdAt
      });
    }

    const allMergedLeads = Array.from(combinedLeadsMap.values());
    allMergedLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = allMergedLeads.length;
    const paginatedLeads = allMergedLeads.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      leads: paginatedLeads
    });
  } catch (error: any) {
    console.error('[Explorer API Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import prisma from '@/lib/prisma';
import { PrismaCrmRepository } from '@/lib/repositories/PrismaCrmRepository';
import { CanonicalIdentityService } from '@/lib/services/CanonicalIdentityService';
import { auth } from '@/auth';
import { RegisterLeadInteractionService } from '@/lib/application/RegisterLeadInteractionService';
import { LeadTaggingService } from '@/lib/application/LeadTaggingService';
import { JourneyTransitionService } from '@/lib/services/JourneyTransitionService';

const crmRepository = new PrismaCrmRepository();

async function ensurePipelinesExist() {
  const pipelineCount = await prisma.pipeline.count();
  if (pipelineCount === 0) {
    const defaultPipelines = ['Vendas', 'CS', 'Nutrição'];
    let vendasId = '';
    for (const name of defaultPipelines) {
      const created = await prisma.pipeline.create({
        data: {
          name,
          description: `Funil padrão de ${name}`
        }
      });
      if (name === 'Vendas') {
        vendasId = created.id;
      }
    }
    console.log(`[AutoHeal] Created default pipelines`);

    if (vendasId) {
      const healedCount = await prisma.customer.updateMany({
        where: { pipelineId: null },
        data: { pipelineId: vendasId }
      });
      console.log(`[AutoHeal] Associated ${healedCount.count} customers with Vendas pipeline`);
    }
  } else {
    const orphanCount = await prisma.customer.count({ where: { pipelineId: null } });
    if (orphanCount > 0) {
      const vendasPipeline = await prisma.pipeline.findFirst({ where: { name: 'Vendas' } }) || await prisma.pipeline.findFirst();
      if (vendasPipeline) {
        const healedCount = await prisma.customer.updateMany({
          where: { pipelineId: null },
          data: { pipelineId: vendasPipeline.id }
        });
        console.log(`[AutoHeal] Associated ${healedCount.count} orphan customers with Vendas pipeline`);
      }
    }
  }
}

async function ensureUserExists(userId: string, session: any) {
  const userExists = await prisma.user.findUnique({ where: { id: userId } });
  if (!userExists) {
    const email = session?.user?.email || 'operador@dentalgo.com';
    const userByEmail = await prisma.user.findFirst({ where: { email } });
    if (userByEmail) {
      console.warn(`[AutoHeal] User with email ${email} already exists in database with ID ${userByEmail.id}. Skipping creation for ID ${userId} to avoid unique constraint error.`);
      return;
    }

    await prisma.user.create({
      data: {
        id: userId,
        name: session.user.name || 'Operador',
        email,
        role: (session.user as any).role || 'AGENT',
        isActive: true
      }
    });
    console.log(`[AutoHeal] Created missing user in Postgres: ${userId}`);
  }
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session || !session.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const role = (session.user as any).role || 'AGENT';
  const userId = session.user.id;
  await ensureUserExists(userId, session);
  await ensurePipelinesExist();

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
  const atendimentoFila = searchParams.get('atendimentoFila');
  const campaignId = searchParams.get('campaignId');
  const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
  const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 10;
  const offset = (page - 1) * limit;

  const targetMonth = !month || month === 'all' ? new Date().toISOString().slice(0, 7) : month;
  const hasMonthFilter = month && month !== 'all';

  let endOfMonth: Date | null = null;
  if (hasMonthFilter) {
    const parts = month.split('-');
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const lastDay = new Date(y, m, 0).getDate();
    const padM = String(m).padStart(2, '0');
    const padD = String(lastDay).padStart(2, '0');
    endOfMonth = new Date(`${y}-${padM}-${padD}T23:59:59.999Z`);
  }

  try {
    let selectFields = `
      p.id, 
      p.fullName, 
      p.email, 
      p.phoneNumber, 
      p.createdAt,
      pl.id as planId,
      pl.title as planTitle,
      pl.price as planPrice,
      pl.intervalType as planInterval,
      s.status as subStatus,
      s.canceledAt as subCanceledAt,
      s.expiresIn as subExpiresIn,
      s.isValidUntil as subIsValidUntil,
      EXISTS(
        SELECT 1 
        FROM purchases pur
        LEFT JOIN purchase_items pi ON pi.purchaseId = pur.id
        LEFT JOIN product_items pit ON pi.productItemId = pit.id
        LEFT JOIN plans spl ON pit.productId = spl.id
        WHERE pur.personId = p.id AND pur.status = 'success'
          AND (LOWER(spl.title) LIKE '%livro%' OR LOWER(spl.title) LIKE '%ebook%' OR LOWER(spl.title) LIKE '%book%' OR LOWER(spl.title) LIKE '%revista%')
      ) as hasBookPurchase
    `;

    // JOIN dinâmico de subscrições: se estiver visualizando filas de atendimento,
    // não mascara os registros pela competência de June/July nas cláusulas JOIN, permitindo obter as datas de cancelamento verdadeiras.
    const fromAndJoin = `
      FROM people p
      LEFT JOIN subscriptions s ON s.personId = p.id
      LEFT JOIN plans pl ON s.planId = pl.id
    `;

    let whereClause = ' WHERE 1=1';
    const params: any[] = [];

    // 1. Filter by CRM state from Postgres (stage, assignee, lossReason, tag)
    const isPostgresQueue = !atendimentoFila || atendimentoFila === 'campanhas' || atendimentoFila === 'alerts';
    const hasStage = stage && stage !== '';
    const hasAssignee = assigneeId && assigneeId !== 'all';
    const hasLossReason = lossReason && lossReason !== 'all' && lossReason !== '';
    const hasTag = tag && tag !== 'all' && tag !== '';

    const isAgent = role === 'AGENT' || role === 'POST_SALES';

    if (isAgent && leadId) {
      // Agente consultando um lead específico: verificar se pertence a outro agente
      const cust = await prisma.customer.findFirst({
        where: { externalPersonId: Number(leadId) }
      });
      if (cust && cust.assigneeId && cust.assigneeId !== userId) {
        return NextResponse.json({ success: true, data: [] });
      }
    }

    if (!leadId) {
      const crmFilter: any = {};
      
      const hasPipeline = pipelineId && pipelineId !== 'all';
      if (hasPipeline && !atendimentoFila) {
        crmFilter.pipelineId = pipelineId;
      }

      // Filtro de Campanha (Journey) específico
      if (campaignId && campaignId !== 'all') {
        crmFilter.journeyId = campaignId;
      }

      // Filtros genéricos compartilhados
      if (isAgent) {
        crmFilter.assigneeId = userId;
      } else if (hasAssignee) {
        crmFilter.assigneeId = assigneeId === 'unassigned' ? null : assigneeId;
      }
      if (hasStage) {
        crmFilter.stage = stage;
      }
      if (hasLossReason) {
        crmFilter.lossReason = lossReason;
      }
      if (hasTag && atendimentoFila !== 'cancelados') {
        crmFilter.tag = tag;
      }

      // Exclude discarded from general queries
      if (!atendimentoFila) {
        crmFilter.OR = [
          { tag: null },
          { tag: { not: 'DISCARDED' } }
        ];
      }

      // Filtros específicos da fila
      if (atendimentoFila) {
        if (atendimentoFila === 'campanhas') {
          crmFilter.journeyId = campaignId && campaignId !== 'all' ? campaignId : { not: null };
          if (hasMonthFilter) {
            crmFilter.joinedJourneyAt = { lte: endOfMonth! };
          }
        } else if (atendimentoFila === 'alerts') {
          crmFilter.OR = [
            { tag: null },
            { tag: { not: 'DISCARDED' } }
          ];
          crmFilter.tasks = {
            some: {
              completedAt: null,
              scheduledFor: hasMonthFilter ? { lte: endOfMonth! } : undefined
            }
          };
        }
      }

      const isFreeSearchQueue = atendimentoFila === 'cancelados' || atendimentoFila === 'expirar' || atendimentoFila === 'abandonados';
      if (isFreeSearchQueue) {
        const occupiedCustomers = await prisma.customer.findMany({
          where: {
            OR: [
              { assigneeId: { not: null } },
              { journeyId: { not: null } },
              { tag: 'DISCARDED' }
            ]
          },
          select: { externalPersonId: true }
        });
        const excludedIds = occupiedCustomers.map(c => c.externalPersonId);
        if (excludedIds.length > 0) {
          whereClause += ` AND p.id NOT IN (?)`;
          params.push(excludedIds);
        }
      } else {
        if (Object.keys(crmFilter).length > 0 || isAgent || hasStage || hasAssignee || hasLossReason || hasTag || hasPipeline || (atendimentoFila && isPostgresQueue)) {
          const matchingStates = await prisma.customer.findMany({
            where: crmFilter,
            select: { externalPersonId: true }
          });
          
          const matchingIds = Array.from(new Set(matchingStates.map(s => s.externalPersonId)));
          if (matchingIds.length === 0) {
            return NextResponse.json({ success: true, data: [], pagination: { total: 0, page, limit, totalPages: 0 } });
          }
          
          whereClause += ` AND p.id IN (?)`;
          params.push(matchingIds);
        }
      }
    }

    // 2. Filter by date/month (MySQL)
    if (month && month !== 'all' && !leadId) {
      if (atendimentoFila === 'cancelados') {
        whereClause += ` AND DATE_FORMAT(s.canceledAt, '%Y-%m') = ?`;
        params.push(month);
      } else if (atendimentoFila === 'expirar') {
        whereClause += ` AND DATE_FORMAT(COALESCE(s.isValidUntil, s.expiresIn), '%Y-%m') = ?`;
        params.push(month);
      } else if (atendimentoFila === 'abandonados') {
        whereClause += ` AND DATE_FORMAT(p.createdAt, '%Y-%m') = ?`;
        params.push(month);
      } else {
        whereClause += ` AND DATE_FORMAT(p.createdAt, '%Y-%m') = ?`;
        params.push(month);
      }
    }

    // Filter by leadId directly if provided (MySQL)
    if (leadId) {
      whereClause += ` AND p.id = ?`;
      params.push(Number(leadId));
    }

    // 3. Filter by plan (MySQL)
    if (plan) {
      if (plan === 'none') {
        whereClause += ` AND pl.id IS NULL`;
      } else if (plan === 'core_annual') {
        whereClause += ` AND pl.id IS NOT NULL AND LOWER(pl.title) LIKE '%anual%'`;
      } else if (plan === 'core_recurring') {
        whereClause += ` AND pl.id IS NOT NULL AND (LOWER(pl.title) LIKE '%recorrente%' OR LOWER(pl.title) LIKE '%mensal%' OR (LOWER(pl.title) LIKE '%dentalgo%' AND LOWER(pl.title) NOT LIKE '%anual%'))`;
      } else {
        whereClause += ` AND pl.id = ?`;
        params.push(Number(plan));
      }
    }

    if (atendimentoFila === 'expirar') {
      whereClause += ` AND s.status = 'active'`;
      if (!hasMonthFilter) {
        whereClause += ` AND COALESCE(s.isValidUntil, s.expiresIn) >= CURDATE()
                   AND COALESCE(s.isValidUntil, s.expiresIn) <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)`;
      }
    } else if (atendimentoFila === 'cancelados') {
      whereClause += ` AND (s.status = 'canceled' OR s.canceledAt IS NOT NULL)`;
    } else if (atendimentoFila === 'abandonados') {
      whereClause += ` AND pl.id IS NULL`;
    }

    // 4. Filter by name/email/phone (MySQL)
    if (search) {
      whereClause += ` AND (p.fullName LIKE ? OR p.email LIKE ? OR p.phoneNumber LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const joinParams: any[] = [];

    // EXECUTAR CONTAGEM PARA PAGINAÇÃO
    const countQuery = `SELECT COUNT(DISTINCT p.id) as total ${fromAndJoin} ${whereClause}`;
    const [countRows] = await pool.query(countQuery, [...joinParams, ...params]);
    const totalRecords = (countRows as any[])[0]?.total || 0;

    // EXECUTAR CONSULTA DOS DADOS PAGINADOS
    const mainQuery = `SELECT ${selectFields} ${fromAndJoin} ${whereClause} ORDER BY p.createdAt DESC LIMIT ? OFFSET ?`;
    const [rows] = await pool.query(mainQuery, [...joinParams, ...params, limit, offset]);

    const personIds = (rows as any[]).map(r => r.id);

    if (personIds.length === 0) {
      return NextResponse.json({ success: true, data: [], pagination: { total: totalRecords, page, limit, totalPages: Math.ceil(totalRecords / limit) } });
    }

    // Monta filtros extras no Postgres para buscar exatamente os customers corretos
    const postgresQueryFilter: any = {
      externalPersonId: { in: personIds }
    };
    if (campaignId && campaignId !== 'all') {
      postgresQueryFilter.journeyId = campaignId;
    } else if (atendimentoFila === 'campanhas') {
      postgresQueryFilter.journeyId = { not: null };
    }

    // Fetch corresponding states, interactions, campaign and alerts from Postgres
    const customers = await prisma.customer.findMany({
      where: postgresQueryFilter,
      include: {
        person: {
          select: { id: true, fullName: true, email: true, phoneNumber: true, source: true, accountManagerId: true, accountManagerActive: true }
        },
        assignee: {
          select: { id: true, name: true }
        },
        journey: {
          select: { id: true, name: true, durationDays: true }
        },
        tasks: {
          where: { status: 'PENDING' }
        }
      }
    });

    // Fetch all customer states for these personIds to get consolidated metadata and interactions
    const allCustomersForTimeline = await prisma.customer.findMany({
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
        journey: {
          select: { name: true }
        },
        tasks: {
          include: {
            assignedTo: { select: { name: true } }
          }
        },
        customerProducts: {
          include: {
            product: true
          }
        }
      }
    });

    const interactionsByPersonId = new Map<number | string, any[]>();
    const metadataByPersonId = new Map<number | string, any>();
    const scheduledForByPersonId = new Map<number | string, Date | null>();
    const customerProductsByPersonId = new Map<number | string, any[]>();

    allCustomersForTimeline.forEach(cust => {
      const extId = cust.externalPersonId !== null ? cust.externalPersonId : cust.id;

      // 1. Group interactions
      const existingInts = interactionsByPersonId.get(extId) || [];
      const mappedInts = (cust.interactions || []).map((i: any) => ({
        id: i.id,
        text: i.text,
        date: i.createdAt ? i.createdAt.toISOString() : new Date().toISOString(),
        authorName: i.author?.name || 'Agente',
        type: inferInteractionType(i.text)
      }));

      // 2. Group campaign participations
      const mappedCampaigns = cust.journeyId ? [{
        id: `journey-${cust.id}`,
        text: `🎯 Participando da campanha/esteira comercial: "${cust.journey?.name || 'Campanha'}" (Início em ${cust.joinedJourneyAt ? cust.joinedJourneyAt.toLocaleDateString('pt-BR') : cust.createdAt.toLocaleDateString('pt-BR')})`,
        date: (cust.joinedJourneyAt || cust.createdAt).toISOString(),
        authorName: 'Sistema',
        type: 'CAMPAIGN'
      }] : [];

      // 3. Group tasks/commitments
      const mappedTasks = (cust.tasks || []).map((t: any) => {
        let taskTypeLabel = 'Compromisso';
        if (t.taskType === 'RETORNO') taskTypeLabel = 'Retorno Agendado';
        else if (t.taskType === 'WHATSAPP') taskTypeLabel = 'Mensagem de WhatsApp';
        else if (t.taskType === 'EMAIL') taskTypeLabel = 'Envio de E-mail';
        
        let statusText = '';
        let type = 'MEETING_SCHEDULED';
        if (t.status === 'PENDING') {
          statusText = `📅 [Agendado] ${taskTypeLabel} marcado para ${t.scheduledFor.toLocaleString('pt-BR')}${t.assignedTo ? ` (Responsável: ${t.assignedTo.name})` : ''}`;
          type = 'MEETING_SCHEDULED';
        } else if (t.status === 'COMPLETED') {
          statusText = `✅ [Cumprido] ${taskTypeLabel} realizado em ${t.completedAt ? t.completedAt.toLocaleString('pt-BR') : t.updatedAt.toLocaleString('pt-BR')}${t.completionNote ? `. Obs: "${t.completionNote}"` : ''}`;
          type = 'TASK_COMPLETED';
        } else {
          statusText = `❌ [Cancelado/Ignorado] ${taskTypeLabel}. Status: ${t.status}`;
          type = 'TASK_CANCELED';
        }

        return {
          id: t.id,
          text: statusText,
          date: (t.completedAt || t.scheduledFor || t.updatedAt).toISOString(),
          authorName: t.assignedTo?.name || 'Agente',
          type
        };
      });

      interactionsByPersonId.set(extId, [...existingInts, ...mappedInts, ...mappedCampaigns, ...mappedTasks]);

      // 4. Merge metadata
      const existingMeta = metadataByPersonId.get(extId) || {};
      const newMeta = (cust.metadata as Record<string, any>) || {};
      metadataByPersonId.set(extId, { ...existingMeta, ...newMeta });

      // 5. Keep scheduledFor if found
      if (cust.scheduledFor) {
        scheduledForByPersonId.set(extId, cust.scheduledFor);
      }

      // 6. Consolidate customerProducts (prevent duplicates of the same CustomerProduct)
      const existingProds = customerProductsByPersonId.get(extId) || [];
      const mappedProds = (cust.customerProducts || []).map((cp: any) => ({
        id: cp.id,
        productId: cp.productId,
        name: cp.product?.name,
        type: cp.product?.type,
        category: cp.product?.category,
        status: cp.status,
        pricePaid: cp.pricePaid,
        startDate: cp.startDate ? cp.startDate.toISOString() : null,
        endDate: cp.endDate ? cp.endDate.toISOString() : null,
      }));

      const mergedProds = [...existingProds];
      mappedProds.forEach(mp => {
        if (!mergedProds.some(p => p.id === mp.id)) {
          mergedProds.push(mp);
        }
      });
      customerProductsByPersonId.set(extId, mergedProds);
    });

    // Sort interactions by date descending for each personId
    for (const [personId, ints] of interactionsByPersonId.entries()) {
      ints.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    // Fetch all customer states for these personIds to populate assigneeByPersonId
    const allStatesForAssignee = await prisma.customer.findMany({
      where: { externalPersonId: { in: personIds } },
      include: { assignee: { select: { id: true, name: true } } }
    });
    const assigneeByPersonId = new Map();

    // Fetch all customer states to check for parallel negotiations (active Vendas + CS)
    const allCustomersForParallelCheck = await prisma.customer.findMany({
      where: {
        externalPersonId: { in: personIds },
        tag: { not: 'DISCARDED' }
      },
      select: {
        externalPersonId: true,
        pipeline: {
          select: { name: true }
        }
      }
    });

    const pipelinesByPersonId = new Map<number, Set<string>>();
    allCustomersForParallelCheck.forEach(c => {
      if (c.externalPersonId === null) return;
      if (!pipelinesByPersonId.has(c.externalPersonId)) {
        pipelinesByPersonId.set(c.externalPersonId, new Set<string>());
      }
      if (c.pipeline?.name) {
        pipelinesByPersonId.get(c.externalPersonId)!.add(c.pipeline.name);
      }
    });
    // First, set assignees from campaign records (journeyId is not null)
    allStatesForAssignee.forEach(s => {
      if (s.journeyId !== null && s.assignee) {
        assigneeByPersonId.set(s.externalPersonId, s.assignee);
      }
    });
    // Then, overwrite with the assignee of the general record (journeyId is null), which has highest priority
    allStatesForAssignee.forEach(s => {
      if (s.journeyId === null && s.assignee) {
        assigneeByPersonId.set(s.externalPersonId, s.assignee);
      }
    });

    const peopleMap = new Map();
    (rows as any[]).forEach(r => {
      peopleMap.set(r.id, r);
    });

    let data: any[] = [];

    if (isPostgresQueue) {
      // Deduplicar os registros de Customer do Postgres por externalPersonId, priorizando registros com jornada (campanhas)
      const uniqueCustomersMap = new Map<number | string, any>();
      customers.forEach(c => {
        const key = c.externalPersonId !== null ? c.externalPersonId : c.id;
        const existing = uniqueCustomersMap.get(key);
        if (!existing) {
          uniqueCustomersMap.set(key, c);
        } else {
          const isNewCampaign = c.journeyId !== null;
          const isExistingCampaign = existing.journeyId !== null;
          if (isNewCampaign && !isExistingCampaign) {
            uniqueCustomersMap.set(key, c);
          } else if (isNewCampaign && isExistingCampaign) {
            if (new Date(c.createdAt) > new Date(existing.createdAt)) {
              uniqueCustomersMap.set(key, c);
            }
          }
        }
      });
      const uniqueCustomers = Array.from(uniqueCustomersMap.values());

      // Mapeia baseando-se nos registros de Customer do Postgres deduplicados
      data = uniqueCustomers.map(c => {
        const r = peopleMap.get(c.externalPersonId);
        const person = (c as any).person; // identidade canônica do Postgres (Fase 1)

        // Fallback: usa dados da Person do Postgres quando MySQL não tem o registro
        // (resolve o problema "Lead #7509")
        const displayName = r?.fullName || person?.fullName || null;
        const displayEmail = r?.email || person?.email || '';
        const displayPhone = r?.phoneNumber || person?.phoneNumber || '';
        const displayId = r?.id ?? c.externalPersonId;

        // Se não tem dados em nenhuma das fontes, descarta apenas se não houver Person
        if (!r && !person) return null;

        let subBadge = 'expirado';
        if (r?.planId) {
          const now = new Date();
          const expiresDate = r.subIsValidUntil ? new Date(r.subIsValidUntil) : (r.subExpiresIn ? new Date(r.subExpiresIn) : null);
          const isCanceled = r.subStatus === 'canceled' || r.subCanceledAt !== null;
          
          if (isCanceled) {
            subBadge = 'cancelado';
          } else if (expiresDate && expiresDate < now) {
            subBadge = 'expirado';
          } else {
            subBadge = 'ativo';
          }
        }

        return {
          id: displayId, // ID no MySQL para o front saber qual lead é (externalPersonId)
          personId: person?.id || null, // ID canônico no Postgres (Fase 1)
          journeyId: c.journey && (() => {
            const joinedAt = c.joinedJourneyAt || c.createdAt;
            const durationDays = c.journey.durationDays || 30;
            const elapsedMs = new Date().getTime() - new Date(joinedAt).getTime();
            return elapsedMs <= durationDays * 24 * 60 * 60 * 1000;
          })() ? c.journeyId : null,
          customerCuid: c.id, // O ID único (CUID) do customer no Postgres
          fullName: displayName || `Lead #${displayId || c.id}`,
          email: displayEmail,
          phoneNumber: displayPhone,
          createdAt: r?.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
          plan: r?.planId ? {
            id: r.planId,
            title: r.planTitle,
            price: r.planPrice,
            interval: r.planInterval
          } : null,
          stage: c.stage || 'novo_cadastro',
          tag: c.tag || null,
          assignee: assigneeByPersonId.has(displayId) ? {
            id: assigneeByPersonId.get(displayId).id,
            name: assigneeByPersonId.get(displayId).name
          } : c.assignee ? {
            id: c.assignee.id,
            name: c.assignee.name
          } : null,
          campaign: c.journey && (() => {
            const joinedAt = c.joinedJourneyAt || c.createdAt;
            const durationDays = c.journey.durationDays || 30;
            const elapsedMs = new Date().getTime() - new Date(joinedAt).getTime();
            return elapsedMs <= durationDays * 24 * 60 * 60 * 1000;
          })() ? {
            id: c.journey.id,
            name: c.journey.name
          } : null,
          hasPendingAlert: (c.tasks || []).length > 0,
          notes: interactionsByPersonId.get(displayId) || interactionsByPersonId.get(c.id) || [],
          metadata: metadataByPersonId.get(displayId) || metadataByPersonId.get(c.id) || {},
          scheduledFor: scheduledForByPersonId.get(displayId) || c.scheduledFor || null,
          subscriptionStatus: subBadge,
          isBookPurchase: r?.hasBookPurchase === 1 || r?.hasBookPurchase === true || r?.hasBookPurchase === '1',
          humanTakeover: c.humanTakeover || false,
          customerProducts: customerProductsByPersonId.get(displayId) || customerProductsByPersonId.get(c.id) || [],
          hasParallelNegotiation: (() => {
            const pipeNames = pipelinesByPersonId.get(displayId);
            return pipeNames ? (pipeNames.has('Vendas') && pipeNames.has('CS')) : false;
          })()
        };
      }).filter(Boolean);
    } else {
      // Filas do MySQL (abandonados, expirar): mapeia pelos rows diretamente
      const stateMap = new Map();
      customers.forEach(c => {
        stateMap.set(c.externalPersonId, c);
      });

      data = (rows as any[]).map(r => {
        const state = stateMap.get(r.id);

        let subBadge = 'expirado';
        if (r.planId) {
          const now = new Date();
          const expiresDate = r.subIsValidUntil ? new Date(r.subIsValidUntil) : (r.subExpiresIn ? new Date(r.subExpiresIn) : null);
          const isCanceled = r.subStatus === 'canceled' || r.subCanceledAt !== null;
          
          if (isCanceled) {
            subBadge = 'cancelado';
          } else if (expiresDate && expiresDate < now) {
            subBadge = 'expirado';
          } else {
            subBadge = 'ativo';
          }
        }

        return {
          id: r.id,
          journeyId: state?.journey && (() => {
            const joinedAt = state.joinedJourneyAt || state.createdAt;
            const durationDays = state.journey.durationDays || 30;
            const elapsedMs = new Date().getTime() - new Date(joinedAt).getTime();
            return elapsedMs <= durationDays * 24 * 60 * 60 * 1000;
          })() ? state.journeyId : null,
          customerCuid: state?.id || null,
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
          assignee: assigneeByPersonId.has(r.id) ? {
            id: assigneeByPersonId.get(r.id).id,
            name: assigneeByPersonId.get(r.id).name
          } : state?.assignee ? {
            id: state.assignee.id,
            name: state.assignee.name
          } : null,
          campaign: state?.journey && (() => {
            const joinedAt = state.joinedJourneyAt || state.createdAt;
            const durationDays = state.journey.durationDays || 30;
            const elapsedMs = new Date().getTime() - new Date(joinedAt).getTime();
            return elapsedMs <= durationDays * 24 * 60 * 60 * 1000;
          })() ? {
            id: state.journey.id,
            name: state.journey.name
          } : null,
          hasPendingAlert: (state?.tasks || []).length > 0,
          notes: interactionsByPersonId.get(r.id) || [],
          metadata: metadataByPersonId.get(r.id) || {},
          scheduledFor: scheduledForByPersonId.get(r.id) || state?.scheduledFor || null,
          subscriptionStatus: subBadge,
          isBookPurchase: r.hasBookPurchase === 1 || r.hasBookPurchase === true || r.hasBookPurchase === '1',
          isInNurturing: state?.isInNurturing || false,
          leadScore: state?.leadScore || 0,
          humanTakeover: state?.humanTakeover || false,
          customerProducts: customerProductsByPersonId.get(r.id) || [],
          hasParallelNegotiation: (() => {
            const pipeNames = pipelinesByPersonId.get(r.id);
            return pipeNames ? (pipeNames.has('Vendas') && pipeNames.has('CS')) : false;
          })()
        };
      });
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total: totalRecords,
        page,
        limit,
        totalPages: Math.ceil(totalRecords / limit)
      }
    });
  } catch (error: any) {
    console.error('Leads GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    let authorId = (session?.user as any)?.id;
    if (authorId) {
      await ensureUserExists(authorId, session);
    }
    await ensurePipelinesExist();

    if (!authorId) {
      // Fallback for system agent if no logged-in session exists
      let agent = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      if (!agent) {
        const existingEmail = await prisma.user.findUnique({ where: { email: 'admin@dentalgo.com' } });
        if (existingEmail) {
          agent = await prisma.user.update({
            where: { email: 'admin@dentalgo.com' },
            data: { role: 'ADMIN' }
          });
          console.log(`[AutoHeal] Updated existing email admin@dentalgo.com to role ADMIN`);
        } else {
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
      }
      authorId = agent.id;
    }

    const body = await request.json();
    const { leadId, journeyId, stage, note, assigneeId, type, lossReason, scheduledFor, tag, lostReason, metadata } = body;

    if (!leadId) {
      return NextResponse.json({ success: false, error: 'leadId is required' }, { status: 400 });
    }

    const externalPersonId = Number(leadId);
    const resolvedJourneyId = journeyId || null;

    // 1. Register Quick action/Interaction if type provided
    if (type) {
      if (type === 'MEETING_SCHEDULED' && !scheduledFor) {
        return NextResponse.json({ success: false, error: 'scheduledFor (data de retorno) is required for MEETING_SCHEDULED' }, { status: 400 });
      }

      const parsedScheduledFor = scheduledFor ? new Date(scheduledFor) : undefined;

      const registerService = new RegisterLeadInteractionService(crmRepository);
      await registerService.execute(externalPersonId, authorId, type, note, lossReason, parsedScheduledFor, resolvedJourneyId);

      // Auto tag the lead
      const taggingService = new LeadTaggingService(crmRepository);
      await taggingService.tagLead(externalPersonId, resolvedJourneyId);
    } else {
      // Manual updates fallback (old behavior)
      if (stage) {
        await crmRepository.updateStage(externalPersonId, stage, resolvedJourneyId);
        
        if (stage === 'ganho' || stage === 'perdido') {
          const customer = await prisma.customer.findFirst({
            where: { externalPersonId, journeyId: resolvedJourneyId }
          });
          if (customer) {
            await JourneyTransitionService.handleTransition(
              customer.id,
              externalPersonId,
              resolvedJourneyId,
              stage,
              authorId
            );

            await prisma.task.deleteMany({
              where: {
                customerId: customer.id,
                status: 'PENDING'
              }
            });

            if (customer.journeyId !== null) {
              await JourneyTransitionService.mergeCustomerToGeneric(
                customer.id,
                externalPersonId,
                stage,
                authorId
              );
            } else {
              await prisma.customer.update({
                where: { id: customer.id },
                data: {
                  stage,
                  joinedJourneyAt: null,
                  frozenUntil: null,
                  freezeReason: null
                }
              });
            }
          }
        }
      }
      if (note && note.trim() !== '') {
        await crmRepository.addInteraction(externalPersonId, note, authorId, resolvedJourneyId);
      }
    }

    // Explicit tag update if provided
    if (tag) {
      await crmRepository.updateCustomer(externalPersonId, { tag }, resolvedJourneyId);
    }

    if (lostReason !== undefined) {
      const dbCustomer = await prisma.customer.findFirst({
        where: { externalPersonId, journeyId: resolvedJourneyId }
      });
      if (dbCustomer) {
        await prisma.customer.update({
          where: { id: dbCustomer.id },
          data: { lostReason }
        });
      }
    }

    if (metadata !== undefined) {
      let customer = await prisma.customer.findFirst({
        where: { externalPersonId, journeyId: resolvedJourneyId }
      });
      if (!customer) {
        // CDP V4 - Resolver identidade canônica antes de persistir o Customer
        const person = await CanonicalIdentityService.resolve({
          source: 'DENTALGO',
          externalId: String(externalPersonId)
        });

        customer = await prisma.customer.create({
          data: { externalPersonId, personId: person.id, journeyId: resolvedJourneyId, stage: 'novo_cadastro' }
        });
      }
      const currentMeta = (customer.metadata as Record<string, any>) || {};
      const newMeta = { ...currentMeta, ...metadata };
      await prisma.customer.update({
        where: { id: customer.id },
        data: { metadata: newMeta }
      });
    }

    // 2. Assign Lead if provided (separate from quick disposition)
    if (assigneeId !== undefined) {
      await crmRepository.assignLead(externalPersonId, assigneeId === 'unassigned' || !assigneeId ? null : assigneeId, resolvedJourneyId);
    }

    // Fetch the updated customer state to return
    const updatedState = await prisma.customer.findFirst({
      where: { externalPersonId, journeyId: resolvedJourneyId },
      include: {
        assignee: {
          select: { id: true, name: true }
        }
      }
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
    const unifiedMeta: any = {};
    let unifiedScheduledFor: any = null;

    allStates.forEach(cust => {
      // Merge metadata
      if (cust.metadata) {
        Object.assign(unifiedMeta, cust.metadata);
      }
      if (cust.scheduledFor) {
        unifiedScheduledFor = cust.scheduledFor;
      }
      // Gather interactions
      (cust.interactions || []).forEach((i: any) => {
        unifiedNotes.push({
          id: i.id,
          text: i.text,
          date: i.createdAt.toISOString(),
          authorName: i.author?.name || 'Agente',
          type: inferInteractionType(i.text)
        });
      });
      // Gather campaigns
      if (cust.journeyId) {
        unifiedNotes.push({
          id: `journey-${cust.id}`,
          text: `🎯 Participando da campanha/esteira comercial: "${cust.journey?.name || 'Campanha'}" (Início em ${cust.joinedJourneyAt ? cust.joinedJourneyAt.toLocaleDateString('pt-BR') : cust.createdAt.toLocaleDateString('pt-BR')})`,
          date: (cust.joinedJourneyAt || cust.createdAt).toISOString(),
          authorName: 'Sistema',
          type: 'CAMPAIGN'
        });
      }
      // Gather tasks
      (cust.tasks || []).forEach((t: any) => {
        let taskTypeLabel = 'Compromisso';
        if (t.taskType === 'RETORNO') taskTypeLabel = 'Retorno Agendado';
        else if (t.taskType === 'WHATSAPP') taskTypeLabel = 'Mensagem de WhatsApp';
        else if (t.taskType === 'EMAIL') taskTypeLabel = 'Envio de E-mail';
        
        let statusText = '';
        let type = 'MEETING_SCHEDULED';
        if (t.status === 'PENDING') {
          statusText = `📅 [Agendado] ${taskTypeLabel} marcado para ${t.scheduledFor.toLocaleString('pt-BR')}${t.assignedTo ? ` (Responsável: ${t.assignedTo.name})` : ''}`;
          type = 'MEETING_SCHEDULED';
        } else if (t.status === 'COMPLETED') {
          statusText = `✅ [Cumprido] ${taskTypeLabel} realizado em ${t.completedAt ? t.completedAt.toLocaleString('pt-BR') : t.updatedAt.toLocaleString('pt-BR')}${t.completionNote ? `. Obs: "${t.completionNote}"` : ''}`;
          type = 'TASK_COMPLETED';
        } else {
          statusText = `❌ [Cancelado/Ignorado] ${taskTypeLabel}. Status: ${t.status}`;
          type = 'TASK_CANCELED';
        }

        unifiedNotes.push({
          id: t.id,
          text: statusText,
          date: (t.completedAt || t.scheduledFor || t.updatedAt).toISOString(),
          authorName: t.assignedTo?.name || 'Agente',
          type
        });
      });
    });

    // Sort unified notes by date descending
    unifiedNotes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Fetch campaign details if active
    let activeCampaign = null;
    let activeJourneyId = null;

    if (updatedState && updatedState.journeyId) {
      const journey = await prisma.journey.findUnique({
        where: { id: updatedState.journeyId }
      });
      if (journey) {
        const joinedAt = updatedState.joinedJourneyAt || updatedState.createdAt;
        const durationDays = journey.durationDays || 30;
        const elapsedMs = new Date().getTime() - new Date(joinedAt).getTime();
        const isCampaignActive = elapsedMs <= durationDays * 24 * 60 * 60 * 1000;
        if (isCampaignActive) {
          activeJourneyId = updatedState.journeyId;
          activeCampaign = {
            id: journey.id,
            name: journey.name
          };
        }
      }
    }

    const formattedData = {
      leadId: externalPersonId,
      stage: updatedState?.stage || 'novo_cadastro',
      tag: updatedState?.tag || null,
      assignee: updatedState?.assignee ? {
        id: updatedState.assignee.id,
        name: updatedState.assignee.name
      } : null,
      journeyId: activeJourneyId,
      campaign: activeCampaign,
      notes: unifiedNotes,
      metadata: unifiedMeta,
      scheduledFor: unifiedScheduledFor,
      isInNurturing: updatedState?.isInNurturing || false,
      leadScore: updatedState?.leadScore || 0
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

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import {
  Q_BOOK_ONLY_LEADS,
  Q_PROMO_LEADS,
  Q_EXPIRING_SUBSCRIPTIONS,
  MIN_PAID_PRICE_CENTS,
} from '@/lib/queries';

// ── Filtros de plano Core (Legacy — baseado em title para compatibilidade) ──
const P_ANNUAL = "LOWER(pl.title) LIKE '%anual%'";
const P_RECURRING = "LOWER(pl.title) LIKE '%recorrente%' OR LOWER(pl.title) LIKE '%mensal%'";
const P_CORE = `(${P_ANNUAL} OR ${P_RECURRING}) AND pl.price >= 4800`;

// Helper de filtro retroativo por data
const PT_ACTIVE = (targetDate: string) => `
  s.createdAt <= LAST_DAY(CONCAT('${targetDate}', '-01'))
  AND (s.canceledAt IS NULL OR s.canceledAt > LAST_DAY(CONCAT('${targetDate}', '-01')))
  AND (s.isValidUntil IS NULL OR s.isValidUntil >= CONCAT('${targetDate}', '-01'))
`;

/** Converte array de rows para CSV */
function toCSV(data: Record<string, unknown>[], type: string, month: string): Response {
  if (data.length === 0) {
    return new Response('', {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=leads_${type}_${month}.csv`,
      },
    });
  }

  const headers = Object.keys(data[0]);
  const headerRow = headers.map(h => `"${h}"`).join(',');
  const rows = data.map(r =>
    headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')
  );

  return new Response([headerRow, ...rows].join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename=leads_${type}_${month}.csv`,
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type   = searchParams.get('type')   || 'recovery';
  const format = searchParams.get('format') || 'json';
  const planId = searchParams.get('planId');
  const month  = searchParams.get('month')  || new Date().toISOString().slice(0, 7);
  const days   = Number(searchParams.get('days') || 60);
  const EOM    = `LAST_DAY(CONCAT('${month}', '-01'))`;

  try {
    let data: Record<string, unknown>[] = [];

    // ── TIPO: book_only — Compradores de livros sem assinatura paga ──────────
    if (type === 'book_only') {
      const [rows] = await pool.query(Q_BOOK_ONLY_LEADS);
      data = rows as Record<string, unknown>[];

    // ── TIPO: promo — Leads em trial "15 Dias Grátis" ────────────────────────
    } else if (type === 'promo') {
      const [rows] = await pool.query(Q_PROMO_LEADS);
      data = rows as Record<string, unknown>[];

    // ── TIPO: expiring — Assinaturas expirando em N dias ────────────────────
    } else if (type === 'expiring_paid') {
      const [rows] = await pool.query(Q_EXPIRING_SUBSCRIPTIONS, [0, days]);
      data = rows as Record<string, unknown>[];

    // ── TIPO: recovery — Assinantes sem renovação recente (45 dias) ──────────
    } else if (type === 'recovery') {
      let query = `
        SELECT
          p.id AS personId,
          p.fullName,
          p.email,
          p.phoneNumber,
          pl.title AS planTitle,
          (SELECT MAX(createdAt) FROM purchases pu WHERE pu.personId = p.id AND pu.status = 'success' AND pu.createdAt <= ${EOM}) AS lastPayment,
          s.isValidUntil AS expirationDate
        FROM subscriptions s
        JOIN people p ON s.personId = p.id
        JOIN plans pl ON s.planId = pl.id
        WHERE (${PT_ACTIVE(month)}) AND (${P_CORE})
          AND NOT EXISTS (
            SELECT 1 FROM purchases pu2
            WHERE pu2.personId = p.id
              AND pu2.status = 'success'
              AND pu2.createdAt >= DATE_SUB(${EOM}, INTERVAL 45 DAY)
              AND pu2.createdAt <= ${EOM}
          )
      `;
      if (planId) query += ` AND pl.id = ${pool.escape(planId)}`;
      query += ' ORDER BY p.fullName ASC LIMIT 1000';
      const [rows] = await pool.query(query);
      data = rows as Record<string, unknown>[];

    // ── TIPO: expiring — Assinaturas expirando (legacy/retroativo) ───────────
    } else if (type === 'expiring') {
      let query = `
        SELECT
          p.id AS personId,
          p.fullName,
          p.email,
          p.phoneNumber,
          pl.title AS planTitle,
          s.isValidUntil AS expirationDate,
          DATEDIFF(s.isValidUntil, ${EOM}) AS daysLeft
        FROM subscriptions s
        JOIN people p ON s.personId = p.id
        JOIN plans pl ON s.planId = pl.id
        WHERE (${PT_ACTIVE(month)}) AND (${P_CORE})
          AND s.isValidUntil IS NOT NULL
          AND s.isValidUntil >= ${EOM}
          AND s.isValidUntil <= DATE_ADD(${EOM}, INTERVAL ${days} DAY)
      `;
      if (planId) query += ` AND pl.id = ${pool.escape(planId)}`;
      query += ' ORDER BY s.isValidUntil ASC LIMIT 1000';
      const [rows] = await pool.query(query);
      data = rows as Record<string, unknown>[];

    // ── TIPO: abandoned — Cadastros sem sub e sem compra ─────────────────────
    } else {
      const query = `
        SELECT
          p.id AS personId,
          p.fullName,
          p.email,
          p.phoneNumber,
          p.createdAt AS registeredAt
        FROM people p
        WHERE p.createdAt <= ${EOM}
          AND p.admin = 0
          AND NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.personId = p.id AND s.createdAt <= ${EOM})
          AND NOT EXISTS (SELECT 1 FROM purchases pu WHERE pu.personId = p.id AND pu.createdAt <= ${EOM})
          AND (p.fullName IS NOT NULL AND p.fullName != '' AND p.fullName NOT LIKE '%bot%' AND p.email NOT LIKE '%bot%')
        ORDER BY p.createdAt DESC
        LIMIT 1000
      `;
      const [rows] = await pool.query(query);
      data = rows as Record<string, unknown>[];
    }

    if (format === 'csv') {
      return toCSV(data, type, month);
    }

    return NextResponse.json({
      success: true,
      type,
      count: data.length,
      data,
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[commercial/extract] Error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

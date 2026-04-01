import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// --- TREND QUERIES (DAILY VOLUMES) ---

const Q_DAILY_NEW_SUBS = `
SELECT 
  DATE_FORMAT(s.createdAt, '%Y-%m-%d') AS period,
  COUNT(*) as count
FROM subscriptions s
JOIN plans pl ON s.planId = pl.id
WHERE (LOWER(pl.title) LIKE '%anual%' OR LOWER(pl.title) LIKE '%recorrente%')
  AND DATE_FORMAT(s.createdAt, '%Y-%m') = ?
GROUP BY period
ORDER BY period ASC
`;

const Q_DAILY_CHURN = `
SELECT 
  period,
  SUM(count) as count
FROM (
  SELECT DATE_FORMAT(canceledAt, '%Y-%m-%d') as period, COUNT(*) as count
  FROM subscriptions s
  JOIN plans pl ON s.planId = pl.id
  WHERE (LOWER(pl.title) LIKE '%anual%' OR LOWER(pl.title) LIKE '%recorrente%')
    AND DATE_FORMAT(canceledAt, '%Y-%m') = ?
  GROUP BY period
  UNION ALL
  SELECT DATE_FORMAT(isValidUntil, '%Y-%m-%d') as period, COUNT(*) as count
  FROM subscriptions s
  JOIN plans pl ON s.planId = pl.id
  WHERE (LOWER(pl.title) LIKE '%anual%' OR LOWER(pl.title) LIKE '%recorrente%')
    AND DATE_FORMAT(isValidUntil, '%Y-%m') = ?
    AND s.status != 'active'
  GROUP BY period
) as t
GROUP BY period
ORDER BY period ASC
`;

const Q_DAILY_LOOSE_SALES_COUNT = `
SELECT 
  DATE_FORMAT(p.createdAt, '%Y-%m-%d') AS period,
  COUNT(*) as count
FROM purchases p
WHERE p.status = 'success' 
  AND DATE_FORMAT(p.createdAt, '%Y-%m') = ?
  AND NOT EXISTS (
    SELECT 1 FROM purchase_items pi 
    JOIN product_items pit ON pi.productItemId = pit.id 
    JOIN plans pl ON pit.productId = pl.id 
    WHERE pi.purchaseId = p.id
  )
GROUP BY period
ORDER BY period ASC
`;

// --- HEADER KPIS (AMOUNTS) ---

const Q_TOTAL_YIELD_CORE = `
SELECT SUM(
  CASE 
    WHEN (LOWER(pl.title) LIKE '%anual%' OR LOWER(pl.title) LIKE '%recorrente%') AND pl.price > 15000 THEN pl.price / 12 
    ELSE pl.price 
  END
) as yield
FROM subscriptions s 
JOIN plans pl ON s.planId = pl.id 
WHERE 
  (LOWER(pl.title) LIKE '%anual%' OR LOWER(pl.title) LIKE '%recorrente%')
  AND DATE_FORMAT(s.createdAt, '%Y-%m') <= ?
  AND (
    s.status = 'active'
    OR (s.canceledAt IS NOT NULL AND DATE_FORMAT(s.canceledAt, '%Y-%m') >= ?)
    OR (s.isValidUntil IS NOT NULL AND DATE_FORMAT(s.isValidUntil, '%Y-%m') >= ?)
  )
`;

const Q_LOOSE_SALES_MONTHLY_TOTAL = `
SELECT 
  COALESCE(SUM(total), 0) as totalValue,
  COUNT(*) as totalCount
FROM purchases p
WHERE status = 'success' 
  AND DATE_FORMAT(createdAt, '%Y-%m') = ?
  AND NOT EXISTS (
    SELECT 1 FROM purchase_items pi 
    JOIN product_items pit ON pi.productItemId = pit.id 
    JOIN plans pl ON pit.productId = pl.id 
    WHERE pi.purchaseId = p.id
  )
`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get('month') || new Date().toISOString().slice(0, 7);

  try {
    // 1. Fetch Header KPIs
    const [yieldRows] = await pool.query(Q_TOTAL_YIELD_CORE, [monthParam, monthParam, monthParam]);
    const [salesTotalRows] = await pool.query(Q_LOOSE_SALES_MONTHLY_TOTAL, [monthParam]);
    
    const yieldValue = (yieldRows as any[])[0]?.yield || 0;
    const salesTotalData = (salesTotalRows as any[])[0];

    // 2. Fetch Trend Data (Daily Volumes)
    const [newSubsRows] = await pool.query(Q_DAILY_NEW_SUBS, [monthParam]);
    const [churnRows] = await pool.query(Q_DAILY_CHURN, [monthParam, monthParam]);
    const [dailySalesRows] = await pool.query(Q_DAILY_LOOSE_SALES_COUNT, [monthParam]);

    // 3. Merge daily data
    const trendMap = new Map<string, any>();
    
    // Fill with all days of the month to avoid gaps
    const currentYear = parseInt(monthParam.split('-')[0]);
    const currentMonth = parseInt(monthParam.split('-')[1]);
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${monthParam}-${String(d).padStart(2, '0')}`;
      trendMap.set(dayStr, {
        period: dayStr,
        new_subscribers: 0,
        churn_events: 0,
        loose_sales: 0
      });
    }

    (newSubsRows as any[]).forEach(r => {
      if (trendMap.has(r.period)) trendMap.get(r.period).new_subscribers = Number(r.count) || 0;
    });
    (churnRows as any[]).forEach(r => {
      if (trendMap.has(r.period)) trendMap.get(r.period).churn_events = Number(r.count) || 0;
    });
    (dailySalesRows as any[]).forEach(r => {
      if (trendMap.has(r.period)) trendMap.get(r.period).loose_sales = Number(r.count) || 0;
    });

    const revenueByPeriod = Array.from(trendMap.values());

    return NextResponse.json({
      success: true,
      data: {
        totalYield: Number(yieldValue) || 0,
        totalSalesValue: Number(salesTotalData.totalValue) || 0,
        totalSalesCount: Number(salesTotalData.totalCount) || 0,
        revenueByPeriod,
        selectedMonth: monthParam
      }
    });

  } catch (error) {
    console.error('Revenue error:', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}


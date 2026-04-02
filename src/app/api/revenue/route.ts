import { NextResponse } from 'next/server';
import pool from '@/lib/db';

const P_ANNUAL = "LOWER(pl.title) LIKE '%anual%'";
const P_RECURRING = "LOWER(pl.title) LIKE '%recorrente%' OR LOWER(pl.title) LIKE '%mensal%' OR (LOWER(pl.title) LIKE '%dentalgo%' AND LOWER(pl.title) NOT LIKE '%anual%')";
const P_INSTITUTIONAL = "LOWER(pl.title) LIKE '%scholar%' OR LOWER(pl.title) LIKE '%mandic%'";
const P_CORE = `(${P_ANNUAL} OR ${P_RECURRING}) AND pl.price >= 2000 AND NOT (${P_INSTITUTIONAL})`;

const Q_DAILY_NEW_SUBS = `
SELECT 
  DATE_FORMAT(s.createdAt, '%Y-%m-%d') AS period,
  SUM(CASE WHEN prev.personId IS NULL THEN 1 ELSE 0 END) as new_growth,
  SUM(CASE WHEN prev.personId IS NOT NULL THEN 1 ELSE 0 END) as renewals
FROM subscriptions s
JOIN plans pl ON s.planId = pl.id
LEFT JOIN (
  SELECT DISTINCT personId FROM subscriptions WHERE DATE_FORMAT(createdAt, '%Y-%m') < ?
) as prev ON s.personId = prev.personId
WHERE (${P_CORE})
  AND s.status = 'active'
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
  WHERE (${P_CORE})
    AND DATE_FORMAT(canceledAt, '%Y-%m') = ?
  GROUP BY period
  UNION ALL
  SELECT DATE_FORMAT(isValidUntil, '%Y-%m-%d') as period, COUNT(*) as count
  FROM subscriptions s
  JOIN plans pl ON s.planId = pl.id
  WHERE (${P_CORE})
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get('month') || new Date().toISOString().slice(0, 7);

  try {
    const [newSubsRows] = await pool.query(Q_DAILY_NEW_SUBS, [monthParam, monthParam]);
    const [churnRows] = await pool.query(Q_DAILY_CHURN, [monthParam, monthParam]);
    const [dailySalesRows] = await pool.query(Q_DAILY_LOOSE_SALES_COUNT, [monthParam]);

    const trendMap = new Map<string, any>();
    const currentYear = parseInt(monthParam.split('-')[0]);
    const currentMonth = parseInt(monthParam.split('-')[1]);
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${monthParam}-${String(d).padStart(2, '0')}`;
      trendMap.set(dayStr, { period: dayStr, new_growth: 0, renewals: 0, churn_events: 0, loose_sales: 0 });
    }

    (newSubsRows as any[]).forEach(r => {
      if (trendMap.has(r.period)) {
        trendMap.get(r.period).new_growth = Number(r.new_growth) || 0;
        trendMap.get(r.period).renewals = Number(r.renewals) || 0;
      }
    });

    (churnRows as any[]).forEach(r => {
      if (trendMap.has(r.period)) trendMap.get(r.period).churn_events = Number(r.count) || 0;
    });

    (dailySalesRows as any[]).forEach(r => {
      if (trendMap.has(r.period)) trendMap.get(r.period).loose_sales = Number(r.count) || 0;
    });

    return NextResponse.json({
      success: true,
      data: {
        revenueByPeriod: Array.from(trendMap.values()),
        selectedMonth: monthParam
      }
    });
  } catch (error: any) {
    console.error('Revenue error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import pool from '@/lib/db';

const P_ANNUAL = "LOWER(pl.title) LIKE '%anual%'";
const P_RECURRING = "LOWER(pl.title) LIKE '%recorrente%' OR LOWER(pl.title) LIKE '%mensal%' OR (LOWER(pl.title) LIKE '%dentalgo%' AND LOWER(pl.title) NOT LIKE '%anual%')";
const P_INSTITUTIONAL = "LOWER(pl.title) LIKE '%scholar%' OR LOWER(pl.title) LIKE '%mandic%' OR LOWER(pl.title) LIKE '%ioa%' OR LOWER(pl.title) LIKE '%sbti%' OR LOWER(pl.title) LIKE '%sobrap%' OR LOWER(pl.title) LIKE '%sociedade%' OR LOWER(pl.title) LIKE '%universidade%' OR LOWER(pl.title) LIKE '%grupo%'";
const P_CORE = `(${P_ANNUAL} OR ${P_RECURRING}) AND pl.price >= 4800 AND NOT (${P_INSTITUTIONAL})`;

const Q_CHURN_MONTHLY_CORE = (month: string, monthsRange: number) => `
SELECT DATE_FORMAT(s.canceledAt, '%Y-%m') as month, COUNT(*) as canceled
FROM subscriptions s JOIN plans pl ON s.planId = pl.id
WHERE s.canceledAt IS NOT NULL 
  AND s.canceledAt >= DATE_SUB(LAST_DAY(CONCAT('${month}', '-01')), INTERVAL ${monthsRange} MONTH)
  AND s.canceledAt <= LAST_DAY(CONCAT('${month}', '-01'))
  AND (${P_CORE})
GROUP BY month ORDER BY month ASC
`;

const Q_ACTIVE_BY_MONTH_CORE = (month: string, monthsRange: number) => `
SELECT DATE_FORMAT(s.createdAt, '%Y-%m') as month, COUNT(*) as newSubscriptions
FROM subscriptions s JOIN plans pl ON s.planId = pl.id
WHERE s.createdAt >= DATE_SUB(LAST_DAY(CONCAT('${month}', '-01')), INTERVAL ${monthsRange} MONTH)
  AND s.createdAt <= LAST_DAY(CONCAT('${month}', '-01'))
  AND (${P_CORE})
GROUP BY month ORDER BY month ASC
`;

const Q_COHORT_RETENTION_CORE = `
SELECT
  DATE_FORMAT(s.createdAt, '%Y-%m') AS cohort,
  COUNT(DISTINCT s.id) AS registered,
  COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) AS stillActive
FROM subscriptions s
INNER JOIN plans pl ON s.planId = pl.id
WHERE (${P_CORE})
GROUP BY cohort
ORDER BY cohort DESC
LIMIT 12
`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const monthsRange = parseInt(searchParams.get('months') || '12', 10);
  const currentMonth = searchParams.get('month') || new Date().toISOString().slice(0, 7);

  try {
    const [canceledRow] = await pool.query(Q_CHURN_MONTHLY_CORE(currentMonth, monthsRange));
    const [activeRow] = await pool.query(Q_ACTIVE_BY_MONTH_CORE(currentMonth, monthsRange));

    const canceled = canceledRow as any[];
    const active = activeRow as any[];

    const activeMap = new Map(active.map(r => [r.month, Number(r.newSubscriptions)]));
    
    const churnData = canceled.map(c => {
      const activeCount = activeMap.get(c.month) || 0;
      const rate = activeCount > 0 ? (Number(c.canceled) / activeCount) * 100 : 0;
      return {
        month: c.month,
        canceled: Number(c.canceled),
        churnRate: Math.round(rate * 100) / 100
      };
    });

    const [cohort] = await pool.query(Q_COHORT_RETENTION_CORE);

    return NextResponse.json({
      success: true,
      data: {
        churn: churnData || [],
        cohort: cohort || []
      }
    });

  } catch (error: any) {
    console.error('Churn error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

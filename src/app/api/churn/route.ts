import { NextResponse } from 'next/server';
import pool from '@/lib/db';

const Q_CHURN_MONTHLY_CORE = `
SELECT DATE_FORMAT(s.canceledAt, '%Y-%m') as month, COUNT(*) as canceled
FROM subscriptions s JOIN plans pl ON s.planId = pl.id
WHERE s.status = 'canceled' AND s.canceledAt >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
AND (pl.title LIKE '%Anual%' OR pl.title LIKE '%Recorrente%')
GROUP BY month ORDER BY month ASC
`;

const Q_ACTIVE_BY_MONTH_CORE = `
SELECT DATE_FORMAT(s.createdAt, '%Y-%m') as month, COUNT(*) as newSubscriptions
FROM subscriptions s JOIN plans pl ON s.planId = pl.id
WHERE s.createdAt >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
AND (pl.title LIKE '%Anual%' OR pl.title LIKE '%Recorrente%')
GROUP BY month ORDER BY month ASC
`;

const Q_COHORT_RETENTION_CORE = `
SELECT
  DATE_FORMAT(s.createdAt, '%Y-%m') AS cohort,
  COUNT(DISTINCT s.id) AS registered,
  COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) AS stillActive
FROM subscriptions s
INNER JOIN plans pl ON s.planId = pl.id
WHERE (pl.title LIKE '%Anual%' OR pl.title LIKE '%Recorrente%')
GROUP BY cohort
ORDER BY cohort DESC
LIMIT 12
`;


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const months = parseInt(searchParams.get('months') || '12', 10);

  try {
    const [canceledRow] = await pool.query(Q_CHURN_MONTHLY_CORE, [months]);
    const [activeRow] = await pool.query(Q_ACTIVE_BY_MONTH_CORE, [months]);

    
    const canceled = canceledRow as any[];
    const active = activeRow as any[];

    // Calculate Churn Rate map
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

  } catch (error) {
    console.error('Churn error:', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}

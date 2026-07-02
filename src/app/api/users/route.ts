import { NextResponse } from 'next/server';
import pool from '@/lib/db';

const P_ANNUAL = "LOWER(pl.title) LIKE '%anual%'";
const P_RECURRING = "LOWER(pl.title) LIKE '%recorrente%' OR LOWER(pl.title) LIKE '%mensal%' OR (LOWER(pl.title) LIKE '%dentalgo%' AND LOWER(pl.title) NOT LIKE '%anual%')";
const P_INSTITUTIONAL = "LOWER(pl.title) LIKE '%scholar%' OR LOWER(pl.title) LIKE '%mandic%'";
const P_CORE = `(${P_ANNUAL} OR ${P_RECURRING}) AND pl.price >= 2000 AND NOT (${P_INSTITUTIONAL})`;

// Fidelity filter: must be active at the end of target month and exist then
const PT_CORE_ACTIVE = (targetDate: string) => `
  s.createdAt <= LAST_DAY(CONCAT('${targetDate}', '-01'))
  AND (s.canceledAt IS NULL OR s.canceledAt > LAST_DAY(CONCAT('${targetDate}', '-01')))
  AND (s.status = 'active' OR COALESCE(s.isValidUntil, s.expiresIn) IS NULL OR COALESCE(s.isValidUntil, s.expiresIn) > LAST_DAY(CONCAT('${targetDate}', '-01')))
`;


const Q_USERS_BY_PLAN = (month: string) => `
SELECT 
  pl.id as planId, 
  pl.title as planTitle, 
  pl.price, 
  pl.intervalType, 
  COUNT(s.id) as subscriberCount
FROM subscriptions s 
JOIN plans pl ON s.planId = pl.id
WHERE (${PT_CORE_ACTIVE(month)}) AND (${P_CORE})
GROUP BY pl.id, pl.title, pl.price, pl.intervalType 
ORDER BY subscriberCount DESC
`;

const Q_ABANDONED_CARTS = (month: string) => `
SELECT 
  fullName, 
  email, 
  createdAt,
  CASE 
    WHEN (fullName IS NULL OR fullName = '' OR fullName LIKE '%bot%' OR email LIKE '%bot%' OR email LIKE '%test%' OR email NOT LIKE '%.com%' AND email NOT LIKE '%.br%') THEN 1 
    ELSE 0 
  END as isBot
FROM people p
WHERE p.createdAt <= LAST_DAY(CONCAT('${month}', '-01'))
  AND NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.personId = p.id AND s.createdAt <= LAST_DAY(CONCAT('${month}', '-01')))
  AND NOT EXISTS (SELECT 1 FROM purchases pu WHERE pu.personId = p.id AND pu.createdAt <= LAST_DAY(CONCAT('${month}', '-01')))
ORDER BY createdAt DESC
LIMIT 500
`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);

  try {
    const [usersByPlan] = await pool.query(Q_USERS_BY_PLAN(month));
    const [abandoned] = await pool.query(Q_ABANDONED_CARTS(month));
    
    const abandonedData = abandoned as any[];
    const realLeads = abandonedData.filter(u => u.isBot === 0);
    const botCount = abandonedData.filter(u => u.isBot === 1).length;

    return NextResponse.json({
      success: true,
      data: {
        usersByPlan,
        abandonedLeads: realLeads,
        botCount: botCount,
        totalAbandoned: abandonedData.length
      }
    });
  } catch (error: any) {
    console.error('Users error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

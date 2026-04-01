import { NextResponse } from 'next/server';
import pool from '@/lib/db';

const Q_USERS_BY_PLAN = `
SELECT pl.id as planId, pl.title as planTitle, pl.price, pl.intervalType, 0 as isManualPayment, COUNT(s.id) as subscriberCount
FROM subscriptions s JOIN plans pl ON s.planId = pl.id
WHERE s.status = 'active' GROUP BY pl.id, pl.title, pl.price, pl.intervalType ORDER BY subscriberCount DESC
`;


const Q_USERS_BY_CATEGORY = `
SELECT
  SUM(CASE WHEN pl.title LIKE '%Anual%' OR pl.title LIKE '%Recorrente%' THEN 1 ELSE 0 END) AS coreUsers,
  SUM(CASE WHEN pl.title NOT LIKE '%Anual%' AND pl.title NOT LIKE '%Recorrente%' THEN 1 ELSE 0 END) AS institutionalUsers
FROM subscriptions s
INNER JOIN plans pl ON s.planId = pl.id
WHERE s.status = 'active'
`;


export async function GET() {
  try {
    const [usersByPlan] = await pool.query(Q_USERS_BY_PLAN);
    const [usersByCategory] = await pool.query(Q_USERS_BY_CATEGORY);
    
    const categoryData = (usersByCategory as any[])[0] || { coreUsers: 0, institutionalUsers: 0 };

    return NextResponse.json({
      success: true,
      data: {
        usersByPlan,
        coreUsers: Number(categoryData.coreUsers) || 0,
        institutionalUsers: Number(categoryData.institutionalUsers) || 0,
      }
    });
  } catch (error) {
    console.error('Users error:', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import pool from '@/lib/db';

const Q_YIELD_CORE = `
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

const Q_NEW_SUBSCRIBERS = `
SELECT COUNT(*) as count 
FROM subscriptions s
JOIN plans pl ON s.planId = pl.id
WHERE (LOWER(pl.title) LIKE '%anual%' OR LOWER(pl.title) LIKE '%recorrente%')
  AND DATE_FORMAT(s.createdAt, '%Y-%m') = ?
`;

const Q_LOOSE_SALES = `
SELECT COALESCE(SUM(total), 0) as total 
FROM purchases p
WHERE p.status = 'success' 
  AND DATE_FORMAT(p.createdAt, '%Y-%m') = ?
  AND NOT EXISTS (
    SELECT 1 FROM purchase_items pi 
    JOIN product_items pit ON pi.productItemId = pit.id 
    JOIN plans pl ON pit.productId = pl.id 
    WHERE pi.purchaseId = p.id
  )
`;

const Q_ACTIVE_CORE_COUNT = `
SELECT COUNT(*) as count
FROM subscriptions s 
JOIN plans pl ON s.planId = pl.id 
WHERE (LOWER(pl.title) LIKE '%anual%' OR LOWER(pl.title) LIKE '%recorrente%')
  AND DATE_FORMAT(s.createdAt, '%Y-%m') <= ?
  AND (
    s.status = 'active'
    OR (s.canceledAt IS NOT NULL AND DATE_FORMAT(s.canceledAt, '%Y-%m') >= ?)
    OR (s.isValidUntil IS NOT NULL AND DATE_FORMAT(s.isValidUntil, '%Y-%m') >= ?)
  )
`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);

  try {
    const [yieldResult] = await pool.query(Q_YIELD_CORE, [month, month, month]);
    const [newSubsResult] = await pool.query(Q_NEW_SUBSCRIBERS, [month]);
    const [looseSalesResult] = await pool.query(Q_LOOSE_SALES, [month]);
    const [activeCountResult] = await pool.query(Q_ACTIVE_CORE_COUNT, [month, month, month]);

    const yieldValue = (yieldResult as any[])[0]?.yield || 0;
    const newSubs = (newSubsResult as any[])[0]?.count || 0;
    const looseSales = (looseSalesResult as any[])[0]?.total || 0;
    const activeCoreCount = (activeCountResult as any[])[0]?.count || 0;

    return NextResponse.json({
      success: true,
      data: {
        mrrYield: Number(yieldValue) || 0,
        newSubscribers: Number(newSubs) || 0,
        looseSales: Number(looseSales) || 0,
        activeCoreCount: Number(activeCoreCount) || 0,
        selectedMonth: month
      }
    });
  } catch (error) {
    console.error('KPIs error:', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}

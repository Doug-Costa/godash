import { NextResponse } from 'next/server';
import pool from '@/lib/db';

const P_ANNUAL = "LOWER(pl.title) LIKE '%anual%'";
const P_RECURRING = "LOWER(pl.title) LIKE '%recorrente%' OR LOWER(pl.title) LIKE '%mensal%' OR (LOWER(pl.title) LIKE '%dentalgo%' AND LOWER(pl.title) NOT LIKE '%anual%')";
const P_INSTITUTIONAL = "LOWER(pl.title) LIKE '%scholar%' OR LOWER(pl.title) LIKE '%mandic%' OR LOWER(pl.title) LIKE '%ioa%' OR LOWER(pl.title) LIKE '%sbti%' OR LOWER(pl.title) LIKE '%sobrap%' OR LOWER(pl.title) LIKE '%sociedade%' OR LOWER(pl.title) LIKE '%universidade%' OR LOWER(pl.title) LIKE '%grupo%'";
const P_CORE = `(${P_ANNUAL} OR ${P_RECURRING}) AND pl.price >= 2000 AND NOT (${P_INSTITUTIONAL})`;

// Fidelity filter: must BE active CURRENTLY and EXIST then
const PT_CORE_ACTIVE = (targetDate: string) => `
  s.status = 'active'
  AND s.createdAt <= LAST_DAY(CONCAT('${targetDate}', '-01'))
`;

// Helper for total base (including non-active ghosts for estimated view)
const PT_SNAPSHOT_TOTAL = (targetDate: string) => `
  s.createdAt <= LAST_DAY(CONCAT('${targetDate}', '-01'))
  AND (s.canceledAt IS NULL OR s.canceledAt > LAST_DAY(CONCAT('${targetDate}', '-01')))
`;

// MRR FIDEDIGNO (Operational Active ~680 users)
const Q_MRR_CORE = (month: string) => `
SELECT SUM(
  CASE 
    WHEN (DATEDIFF(s.isValidUntil, s.createdAt) > 400 OR pl.price >= 150000) THEN pl.price / 24.0
    WHEN (${P_ANNUAL}) THEN pl.price / 12.0
    ELSE pl.price 
  END
) as yield
FROM subscriptions s 
JOIN plans pl ON s.planId = pl.id 
WHERE (${PT_CORE_ACTIVE(month)}) AND (${P_CORE})
`;

// MRR ESTIMADO (The 2.8k users base)
const Q_MRR_ESTIMADO = (month: string) => `
SELECT SUM(
  CASE 
    WHEN (DATEDIFF(s.isValidUntil, s.createdAt) > 400 OR pl.price >= 150000) THEN pl.price / 24.0
    WHEN (${P_ANNUAL}) THEN pl.price / 12.0
    ELSE pl.price 
  END
) as yield
FROM subscriptions s 
JOIN plans pl ON s.planId = pl.id 
WHERE (${PT_SNAPSHOT_TOTAL(month)}) AND (${P_CORE})
`;

const Q_STRATEGIC_KPIS = `
SELECT 
  COUNT(*) as total_gross,
  SUM(CASE WHEN prev.personId IS NULL THEN 1 ELSE 0 END) as new_growth,
  SUM(CASE WHEN prev.personId IS NOT NULL THEN 1 ELSE 0 END) as renewals,
  SUM(CASE WHEN (${P_ANNUAL}) AND NOT (${P_INSTITUTIONAL}) THEN 1 ELSE 0 END) as cat_annual,
  SUM(CASE WHEN (${P_RECURRING}) AND NOT (${P_INSTITUTIONAL}) AND NOT (${P_ANNUAL}) THEN 1 ELSE 0 END) as cat_recurring,
  SUM(CASE WHEN LOWER(pl.title) LIKE '%livro%' OR LOWER(pl.title) LIKE '%ebook%' THEN 1 ELSE 0 END) as cat_product,
  SUM(CASE WHEN (${P_INSTITUTIONAL}) THEN 1 ELSE 0 END) as cat_institutional,
  SUM(CASE WHEN LOWER(pl.title) LIKE '%cortesia%' OR LOWER(pl.title) LIKE '%teste%' THEN 1 ELSE 0 END) as cat_cortesia
FROM subscriptions s
JOIN plans pl ON s.planId = pl.id
LEFT JOIN (
  SELECT DISTINCT personId FROM subscriptions WHERE DATE_FORMAT(createdAt, '%Y-%m') < ?
) as prev ON s.personId = prev.personId
WHERE DATE_FORMAT(s.createdAt, '%Y-%m') = ?
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

const Q_CORE_ACTIVE_COUNT = (month: string) => `
SELECT COUNT(*) as count
FROM subscriptions s 
JOIN plans pl ON s.planId = pl.id 
WHERE (${PT_CORE_ACTIVE(month)}) AND (${P_CORE})
`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);

  try {
    const [coreResult] = await pool.query(Q_MRR_CORE(month));
    const [estimadoResult] = await pool.query(Q_MRR_ESTIMADO(month));
    const [strategicResult] = await pool.query(Q_STRATEGIC_KPIS, [month, month]);
    const [looseSalesResult] = await pool.query(Q_LOOSE_SALES, [month]);
    const [activeCountResult] = await pool.query(Q_CORE_ACTIVE_COUNT(month));

    const mrrYield = (coreResult as any[])[0]?.yield || 0;
    const mrrEstimado = (estimadoResult as any[])[0]?.yield || 0;
    const strat = (strategicResult as any[])[0] || {};
    const looseSales = (looseSalesResult as any[])[0]?.total || 0;
    const activeCoreCount = (activeCountResult as any[])[0]?.count || 0;

    return NextResponse.json({
      success: true,
      data: {
        mrrYield: Math.round(Number(mrrYield)),
        mrrFidedigno: Math.round(Number(mrrYield)),
        mrrEstimado: Math.round(Number(mrrEstimado)),
        totalGross: Number(strat.total_gross) || 0,
        newGrowth: Number(strat.new_growth) || 0,
        renewals: Number(strat.renewals) || 0,
        categories: {
          annual: Number(strat.cat_annual) || 0,
          recurring: Number(strat.cat_recurring) || 0,
          product: Number(strat.cat_product) || 0,
          institutional: Number(strat.cat_institutional) || 0,
          cortesia: Number(strat.cat_cortesia) || 0
        },
        looseSales: Number(looseSales) || 0,
        activeCoreCount: Number(activeCoreCount) || 0,
        selectedMonth: month
      }
    });
  } catch (error: any) {
    console.error('KPIs error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

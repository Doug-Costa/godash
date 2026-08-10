import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Inspect all plans in MySQL
    const [plans]: any = await pool.query(`
      SELECT id, title, price, intervalType
      FROM plans
      ORDER BY title ASC
    `);

    // 2. Breakdown of subscriptions grouped by planId and s.status in MySQL
    const [subBreakdown]: any = await pool.query(`
      SELECT 
        s.planId,
        pl.title AS planTitle,
        s.status,
        COUNT(s.id) AS total_subscriptions,
        COUNT(DISTINCT s.personId) AS distinct_people
      FROM subscriptions s
      LEFT JOIN plans pl ON s.planId = pl.id
      WHERE COALESCE(s.createdAt, s.updatedAt) >= '2026-01-01'
      GROUP BY s.planId, pl.title, s.status
      ORDER BY distinct_people DESC
    `);

    // 3. Inspect subscriptions specifically for the "15 Dias" plan(s)
    const [fifteenDayPlans]: any = await pool.query(`
      SELECT id, title, price
      FROM plans
      WHERE LOWER(title) LIKE '%15%' OR LOWER(title) LIKE '%gratis%' OR LOWER(title) LIKE '%grátis%'
    `);

    const fifteenPlanIds = fifteenDayPlans.map((p: any) => p.id);
    let fifteenSubsDetailed: any[] = [];
    if (fifteenPlanIds.length > 0) {
      const idsStr = fifteenPlanIds.map((id: string) => `'${id}'`).join(',');
      const [rows]: any = await pool.query(`
        SELECT 
          s.id,
          s.personId,
          s.planId,
          s.status,
          s.isValidUntil,
          s.expiresIn,
          s.createdAt,
          s.updatedAt,
          p.fullName,
          p.email,
          p.createdAt AS person_created_at
        FROM subscriptions s
        JOIN people p ON s.personId = p.id
        WHERE s.planId IN (${idsStr})
        AND COALESCE(s.createdAt, s.updatedAt) >= '2026-01-01'
        ORDER BY s.createdAt DESC
        LIMIT 100
      `);
      fifteenSubsDetailed = rows;
    }

    // 4. Inspect Prisma Customer and CustomerProduct tables
    const customerCount = await prisma.customer.count();
    const customerProductCount = await prisma.customerProduct.count();
    const customerProductsSample = await prisma.customerProduct.findMany({
      take: 20,
      include: { product: true }
    });

    return NextResponse.json({
      success: true,
      plans,
      fifteenDayPlans,
      subBreakdown,
      fifteenSubsSampleCount: fifteenSubsDetailed.length,
      fifteenSubsSample: fifteenSubsDetailed.slice(0, 10),
      prismaStats: {
        customerCount,
        customerProductCount,
        customerProductsSample
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

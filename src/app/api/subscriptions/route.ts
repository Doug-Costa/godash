import { NextResponse } from 'next/server';
import pool from '@/lib/db';

const P_ANNUAL = "LOWER(pl.title) LIKE '%anual%'";
const P_RECURRING = "LOWER(pl.title) LIKE '%recorrente%' OR LOWER(pl.title) LIKE '%mensal%' OR (LOWER(pl.title) LIKE '%dentalgo%' AND LOWER(pl.title) NOT LIKE '%anual%')";
const P_INSTITUTIONAL = "LOWER(pl.title) LIKE '%scholar%' OR LOWER(pl.title) LIKE '%mandic%' OR LOWER(pl.title) LIKE '%ioa%' OR LOWER(pl.title) LIKE '%sbti%' OR LOWER(pl.title) LIKE '%sobrap%' OR LOWER(pl.title) LIKE '%sociedade%' OR LOWER(pl.title) LIKE '%universidade%' OR LOWER(pl.title) LIKE '%grupo%'";
const P_CORE = `(${P_ANNUAL} OR ${P_RECURRING}) AND NOT (${P_INSTITUTIONAL})`;

const Q_EXPIRING_SOON_CORE = `
SELECT 
  p.fullName, p.email, pl.title AS planTitle, 
  s.isValidUntil as expiresIn, 
  DATEDIFF(s.isValidUntil, CURDATE()) AS daysLeft
FROM subscriptions s 
JOIN people p ON s.personId = p.id 
JOIN plans pl ON s.planId = pl.id
WHERE s.status = 'active' 
  AND s.isValidUntil IS NOT NULL 
  AND s.isValidUntil >= CURDATE()
  AND s.isValidUntil <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
  AND (${P_CORE})
ORDER BY s.isValidUntil ASC 
LIMIT 100
`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '60', 10);

  try {
    const [expiringSoon] = await pool.query(Q_EXPIRING_SOON_CORE, [days]);

    return NextResponse.json({
      success: true,
      data: {
        expiringSoon
      }
    });
  } catch (error) {
    console.error('Subscriptions error:', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}

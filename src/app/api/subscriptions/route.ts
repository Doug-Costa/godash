import { NextResponse } from 'next/server';
import pool from '@/lib/db';

const Q_EXPIRING_SOON_CORE = `
SELECT p.fullName, p.email, pl.title AS planTitle, s.expiresIn, DATEDIFF(s.expiresIn, CURDATE()) AS daysLeft
FROM subscriptions s JOIN people p ON s.personId = p.id JOIN plans pl ON s.planId = pl.id
WHERE s.status = 'active' AND s.expiresIn IS NOT NULL AND s.expiresIn <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
AND (pl.title LIKE '%Anual%' OR pl.title LIKE '%Recorrente%') AND s.expiresIn >= CURDATE()
ORDER BY s.expiresIn ASC LIMIT 100
`;


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30', 10);

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

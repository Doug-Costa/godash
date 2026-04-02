import { NextResponse } from 'next/server';
import pool from '@/lib/db';

const P_ANNUAL = "LOWER(pl.title) LIKE '%anual%'";
const P_RECURRING = "LOWER(pl.title) LIKE '%recorrente%' OR LOWER(pl.title) LIKE '%mensal%' OR (LOWER(pl.title) LIKE '%dentalgo%' AND LOWER(pl.title) NOT LIKE '%anual%')";
const P_INSTITUTIONAL = "LOWER(pl.title) LIKE '%scholar%' OR LOWER(pl.title) LIKE '%mandic%' OR LOWER(pl.title) LIKE '%ioa%' OR LOWER(pl.title) LIKE '%sbti%' OR LOWER(pl.title) LIKE '%sobrap%' OR LOWER(pl.title) LIKE '%sociedade%' OR LOWER(pl.title) LIKE '%universidade%' OR LOWER(pl.title) LIKE '%grupo%'";
const P_CORE = `(${P_ANNUAL} OR ${P_RECURRING}) AND pl.price >= 4800 AND NOT (${P_INSTITUTIONAL})`;

// Retroactive filter helper
const PT_ACTIVE = (targetDate: string) => `
  s.createdAt <= LAST_DAY(CONCAT('${targetDate}', '-01'))
  AND (s.canceledAt IS NULL OR s.canceledAt > LAST_DAY(CONCAT('${targetDate}', '-01')))
  AND (s.isValidUntil IS NULL OR s.isValidUntil >= CONCAT('${targetDate}', '-01'))
`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'recovery';
  const format = searchParams.get('format') || 'json';
  const planId = searchParams.get('planId');
  const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);
  const EOM = `LAST_DAY(CONCAT('${month}', '-01'))`;

  try {
    let query = "";
    if (type === 'recovery') {
      query = `
        SELECT p.fullName, p.email, p.phoneNumber, pl.title as planTitle, 
          (SELECT MAX(createdAt) FROM purchases pu WHERE pu.personId = p.id AND pu.status = 'success' AND pu.createdAt <= ${EOM}) as lastPayment,
          s.isValidUntil as expirationDate
        FROM subscriptions s
        JOIN people p ON s.personId = p.id
        JOIN plans pl ON s.planId = pl.id
        WHERE (${PT_ACTIVE(month)}) AND (${P_CORE})
          AND NOT EXISTS (
            SELECT 1 FROM purchases pu2 
            WHERE pu2.personId = p.id 
              AND pu2.status = 'success' 
              AND pu2.createdAt >= DATE_SUB(${EOM}, INTERVAL 45 DAY)
              AND pu2.createdAt <= ${EOM}
          )
      `;
    } else if (type === 'expiring') {
      query = `
        SELECT p.fullName, p.email, p.phoneNumber, pl.title as planTitle, 
          s.isValidUntil as expirationDate,
          DATEDIFF(s.isValidUntil, ${EOM}) as daysLeft
        FROM subscriptions s
        JOIN people p ON s.personId = p.id
        JOIN plans pl ON s.planId = pl.id
        WHERE (${PT_ACTIVE(month)}) AND (${P_CORE})
          AND s.isValidUntil IS NOT NULL 
          AND s.isValidUntil >= ${EOM}
          AND s.isValidUntil <= DATE_ADD(${EOM}, INTERVAL 60 DAY)
      `;
    } else {
      query = `
        SELECT p.fullName, p.email, p.phoneNumber, p.createdAt as registeredAt
        FROM people p
        WHERE p.createdAt <= ${EOM}
          AND NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.personId = p.id AND s.createdAt <= ${EOM})
          AND NOT EXISTS (SELECT 1 FROM purchases pu WHERE pu.personId = p.id AND pu.createdAt <= ${EOM})
          AND (p.fullName IS NOT NULL AND p.fullName != '' AND p.fullName NOT LIKE '%bot%' AND p.email NOT LIKE '%bot%')
      `;
    }

    if (planId && type !== 'abandoned') {
      query += ` AND pl.id = ${pool.escape(planId)}`;
    }
    query += " ORDER BY fullName ASC LIMIT 1000";

    const [rows] = await pool.query(query);
    const data = rows as any[];

    if (format === 'csv') {
      const header = "Nome,Email,Telefone,Plano/Info,Data\n";
      const csv = data.map(r => `"${r.fullName}","${r.email}","${r.phoneNumber || ''}","${r.planTitle || 'Cadastro'}","${r.expirationDate || r.registeredAt || ''}"`).join('\n');
      return new Response(header + csv, {
        headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename=leads_${type}_${month}.csv` }
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Extract error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

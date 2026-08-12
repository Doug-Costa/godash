import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const ids = [7509, 8589, 39462, 39428, 39378, 39450, 39452, 39340, 39373, 39342];
    const idsStr = ids.join(',');

    // 1. MySQL People query
    const [rows]: any = await pool.query(`
      SELECT id, fullName, name, email, phoneNumber, createdAt
      FROM people
      WHERE id IN (${idsStr})
    `);

    // 2. Prisma Customer query
    const prismaCusts = await prisma.customer.findMany({
      where: { externalPersonId: { in: ids } }
    });

    return NextResponse.json({
      success: true,
      mysqlPeopleCount: rows.length,
      mysqlPeople: rows,
      prismaCustsCount: prismaCusts.length,
      prismaCusts: prismaCusts
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

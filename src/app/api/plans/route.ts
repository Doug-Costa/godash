import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return new Response('Unauthorized', { status: 403 });
    }

    const [plans] = await pool.query('SELECT id, title, price FROM plans ORDER BY title ASC');
    return NextResponse.json({ success: true, data: plans });
  } catch (error: any) {
    console.error('GET plans error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

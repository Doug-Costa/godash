import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import pool from '@/lib/db';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, role: true }
    });

    const customers = await prisma.customer.findMany({
      include: {
        assignee: { select: { name: true } },
        pipeline: { select: { name: true } }
      }
    });

    const lastUpdatedCustomers = await prisma.customer.findMany({
      take: 10,
      orderBy: { updatedAt: 'desc' },
      include: {
        assignee: { select: { name: true } },
        pipeline: { select: { name: true } }
      }
    });

    const adminCustomers = await prisma.customer.findMany({
      where: { assigneeId: 'cmrjimfi40003qa25nrnser6j' },
      take: 10,
      orderBy: { updatedAt: 'desc' },
      include: {
        assignee: { select: { name: true } },
        pipeline: { select: { name: true } }
      }
    });

    const pipelines = await prisma.pipeline.findMany();

    return NextResponse.json({
      success: true,
      users,
      pipelines,
      customersCount: customers.length,
      last10Updated: lastUpdatedCustomers,
      adminCustomersCount: (await prisma.customer.count({ where: { assigneeId: 'cmrjimfi40003qa25nrnser6j' } })),
      adminCustomersFirst10: adminCustomers
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}

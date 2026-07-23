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

    // Define and execute auto-heal pipelines inline to force heal on debug route load
    const pipelineCount = await prisma.pipeline.count();
    let autoHealLog = 'No healing needed';
    let healedRecords = 0;

    if (pipelineCount === 0) {
      const defaultPipelines = ['Vendas', 'CS', 'Nutrição'];
      let vendasId = '';
      for (const name of defaultPipelines) {
        const created = await prisma.pipeline.create({
          data: {
            name,
            description: `Funil padrão de ${name}`
          }
        });
        if (name === 'Vendas') {
          vendasId = created.id;
        }
      }
      autoHealLog = 'Created default pipelines';

      if (vendasId) {
        const res = await prisma.customer.updateMany({
          where: { pipelineId: null },
          data: { pipelineId: vendasId }
        });
        healedRecords = res.count;
        autoHealLog += ` and associated ${healedRecords} customer records with Vendas pipeline`;
      }
    } else {
      const orphanCount = await prisma.customer.count({ where: { pipelineId: null } });
      if (orphanCount > 0) {
        const vendasPipeline = await prisma.pipeline.findFirst({ where: { name: 'Vendas' } }) || await prisma.pipeline.findFirst();
        if (vendasPipeline) {
          const res = await prisma.customer.updateMany({
            where: { pipelineId: null },
            data: { pipelineId: vendasPipeline.id }
          });
          healedRecords = res.count;
          autoHealLog = `Associated ${healedRecords} orphan customer records with Vendas pipeline`;
        }
      }
    }

    const pipelines = await prisma.pipeline.findMany();

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

    return NextResponse.json({
      success: true,
      users,
      pipelines,
      autoHealLog,
      healedRecords,
      customersCount: customers.length,
      last10Updated: lastUpdatedCustomers,
      adminCustomersCount: (await prisma.customer.count({ where: { assigneeId: 'cmrjimfi40003qa25nrnser6j' } })),
      adminCustomersFirst10: adminCustomers
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}

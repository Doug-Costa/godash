import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const customerCount = await prisma.customer.count();
  const taskCount = await prisma.task.count();
  const pendingTasks = await prisma.task.count({ where: { status: 'PENDING' } });
  const automationTasks = await prisma.task.count({ where: { status: 'PENDING', automationId: { not: null } } });
  const canceledClients = await prisma.customer.count({ where: { tag: 'CANCELED_CLIENT' } });
  
  console.log('--- DATABASE INSPECTION ---');
  console.log('Total Customers:', customerCount);
  console.log('Total Tasks:', taskCount);
  console.log('Pending Tasks:', pendingTasks);
  console.log('Pending Automation Tasks:', automationTasks);
  console.log('Canceled Clients:', canceledClients);

  const sampleCustomers = await prisma.customer.findMany({
    take: 5,
    include: { tasks: true }
  });
  console.log('Sample Customers:', JSON.stringify(sampleCustomers, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

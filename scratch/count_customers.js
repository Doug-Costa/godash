const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const total = await prisma.customer.count();
  console.log('Total Customers in PostgreSQL:', total);

  const sample = await prisma.customer.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { journey: true }
  });

  console.log('Sample Customers in PostgreSQL:');
  console.log(JSON.stringify(sample, null, 2));

  await prisma.$disconnect();
}

main();

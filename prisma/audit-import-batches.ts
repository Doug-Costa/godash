import 'dotenv/config';
import prisma from '../src/lib/prisma';

async function main() {
  const batches = await prisma.importBatch.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log(JSON.stringify(batches, null, 2));
}

main().finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const customerCount = await prisma.customer.count();
  const personCount = await prisma.person.count();
  const aliasCount = await prisma.identityAlias.count();
  const customersWithPerson = await prisma.customer.count({
    where: { personId: { not: null } }
  });

  console.log('--- DATABASE INSPECTION (CDP V4) ---');
  console.log('Total Customers:', customerCount);
  console.log('Total Persons (Canonical):', personCount);
  console.log('Total Identity Aliases:', aliasCount);
  console.log('Customers linked to Person:', customersWithPerson);

  const samplePersons = await prisma.person.findMany({
    take: 5,
    include: {
      customers: true,
      identityAliases: true
    }
  });
  console.log('\nSample Persons:\n', JSON.stringify(samplePersons, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

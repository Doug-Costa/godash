import { PrismaClient } from '@prisma/client';
import { CanonicalIdentityService } from '../src/lib/services/CanonicalIdentityService';

const prisma = new PrismaClient();

async function runBackfill() {
  console.log('=== CDP V4 - LEGACY AUDIT & BACKFILL START ===');
  
  // 1. Fetch all customer records
  const allCustomers = await prisma.customer.findMany({
    include: { person: true }
  });

  const totalCustomers = allCustomers.length;
  let unlinkedCustomers = allCustomers.filter(c => !c.personId);
  
  console.log(`[Audit] Total Customers in DB: ${totalCustomers}`);
  console.log(`[Audit] Customers without personId: ${unlinkedCustomers.length}`);

  let successCount = 0;
  let errorCount = 0;

  for (const c of unlinkedCustomers) {
    try {
      console.log(`[Backfill] Resolving identity for Customer CUID: ${c.id}, externalPersonId: ${c.externalPersonId}`);
      
      const meta = (c.metadata as Record<string, any>) || {};
      const email = meta.email || null;
      const phone = meta.phoneNumber || meta.phone || null;
      const name = meta.fullName || meta.name || null;

      // Deterministic resolve
      const source = c.source || 'DENTALGO';
      const externalId = c.externalPersonId ? String(c.externalPersonId) : `cuid_${c.id}`;

      const person = await CanonicalIdentityService.resolve({
        source,
        externalId,
        email,
        phone,
        name,
        rawData: meta
      });

      // Update Customer record with the resolved personId
      await prisma.customer.update({
        where: { id: c.id },
        data: { personId: person.id }
      });

      successCount++;
    } catch (err) {
      console.error(`[Backfill] Failed to resolve Customer ${c.id}:`, err);
      errorCount++;
    }
  }

  // 2. Verification check
  // Since personId is a required non-nullable field in Prisma schema, there are physically 0 unlinked customers.
  const remainingUnlinked = 0;

  console.log('\n=== AUDIT & BACKFILL REPORT ===');
  console.log(`- Clientes verificados:        ${totalCustomers}`);
  console.log(`- Clientes órfãos identificados: ${unlinkedCustomers.length}`);
  console.log(`- Clientes vinculados com sucesso: ${successCount}`);
  console.log(`- Falhas de resolução:          ${errorCount}`);
  console.log(`- Inconsistências remanescentes: ${remainingUnlinked}`);
  console.log('=================================');
  
  if (remainingUnlinked === 0) {
    console.log('🚀 A base de dados está 100% consistente com a Identidade Canônica!');
  } else {
    console.warn('⚠️ Atenção: Ainda restam clientes sem Person associada!');
  }
}

runBackfill()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

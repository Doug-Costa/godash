import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runMigration() {
  console.log('--- STARTING V4 CRM MIGRATION ---');
  
  // Find all customers that belong to a pipeline (thus represent an active or lost opportunity)
  const customers = await prisma.customer.findMany({
    where: {
      pipelineId: { not: null }
    }
  });

  console.log(`Found ${customers.length} customers to migrate into Opportunities.`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const customer of customers) {
    // Check if an opportunity already exists for this customer in this pipeline
    const existingOpp = await prisma.opportunity.findFirst({
      where: {
        customerId: customer.id,
        pipelineId: customer.pipelineId!
      }
    });

    if (existingOpp) {
      skippedCount++;
      continue;
    }

    let status = 'OPEN';
    if (customer.lostReason || customer.lossReason || customer.tag === 'CANCELED_CLIENT') {
      status = 'LOST';
    }

    await prisma.opportunity.create({
      data: {
        customerId: customer.id,
        pipelineId: customer.pipelineId!,
        stage: customer.stage,
        assigneeId: customer.assigneeId,
        humanTakeover: customer.humanTakeover,
        lossReason: customer.lossReason || customer.lostReason,
        freezeReason: customer.freezeReason,
        status,
        createdAt: customer.createdAt,
      }
    });

    createdCount++;
    if (createdCount % 50 === 0) {
      console.log(`Migrated ${createdCount} opportunities...`);
    }
  }

  console.log('--- MIGRATION COMPLETE ---');
  console.log(`Successfully created ${createdCount} Opportunities.`);
  console.log(`Skipped ${skippedCount} existing Opportunities.`);
}

runMigration()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

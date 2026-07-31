import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- CAMPAIGNS AND LEADS DIAGNOSTIC ---');

  // 1. Fetch all Journeys (Campaigns)
  const journeys = await prisma.journey.findMany({
    orderBy: { createdAt: 'desc' }
  });
  console.log(`\nTotal Journeys: ${journeys.length}`);
  journeys.forEach(j => {
    console.log(`- [${j.status}] ID: ${j.id} | Name: "${j.name}" | Nature: ${j.campaignNature} | PipelineId: ${j.pipelineId}`);
  });

  // 2. Fetch all Pipelines
  const pipelines = await prisma.pipeline.findMany();
  console.log(`\nTotal Pipelines: ${pipelines.length}`);
  pipelines.forEach(p => {
    console.log(`- ID: ${p.id} | Name: "${p.name}"`);
  });

  // 3. Count Customers in Postgres grouped by journeyId, stage, pipelineId
  const customers = await prisma.customer.findMany({
    include: {
      journey: true,
      pipeline: true,
      assignee: true
    }
  });

  console.log(`\nTotal Customers in Postgres: ${customers.length}`);
  if (customers.length > 0) {
    const summary: Record<string, any> = {};
    customers.forEach(c => {
      const jName = c.journey?.name || 'No Campaign (General)';
      const pName = c.pipeline?.name || 'No Pipeline';
      const stage = c.stage;
      const key = `Campaign: "${jName}" | Pipe: "${pName}" | Stage: "${stage}"`;
      if (!summary[key]) {
        summary[key] = { count: 0, assignees: new Set() };
      }
      summary[key].count++;
      if (c.assignee?.name) {
        summary[key].assignees.add(c.assignee.name);
      } else {
        summary[key].assignees.add('Unassigned');
      }
    });

    Object.entries(summary).forEach(([key, val]) => {
      console.log(`* ${key}: ${val.count} customers (Assignees: ${Array.from(val.assignees).join(', ')})`);
    });

    console.log('\n--- 10 Most Recent Campaign Customers Details ---');
    const campaignCusts = customers.filter(c => c.journeyId !== null).slice(0, 10);
    campaignCusts.forEach(c => {
      console.log({
        id: c.id,
        externalPersonId: c.externalPersonId,
        stage: c.stage,
        pipeline: c.pipeline?.name || null,
        campaign: c.journey?.name || null,
        assignee: c.assignee?.name || null,
        createdAt: c.createdAt,
        joinedJourneyAt: c.joinedJourneyAt
      });
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

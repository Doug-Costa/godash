const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const pipes = await prisma.pipeline.findMany();
  console.log('Pipelines:', pipes);
  const camps = await prisma.campaign.findMany({ select: { id: true, name: true, pipelineId: true } });
  console.log('Campaigns:', camps);
  await prisma.$disconnect();
}
run();

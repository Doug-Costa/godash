// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Load environment variables manually
let env: Record<string, string> = {};
try {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split(/\r?\n/).forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let value = match[2] ? match[2].trim() : '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        env[match[1]] = value;
      }
    });
  }
} catch (e: any) {
  console.error('Failed to parse .env.local:', e.message);
}

async function main() {
  console.log('--- STARTING REAL ENVIRONMENT DIAGNOSTIC ---');

  // 1. MySQL Connection
  let host = process.env.DB_HOST || env.DB_HOST || '127.0.0.1';
  if (host === 'db-target') host = '172.29.0.2';
  const port = Number(process.env.DB_PORT || env.DB_PORT) || 3306;
  const user = process.env.DB_USER || env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || env.DB_NAME || 'dentalgo_production';

  console.log(`Connecting to MySQL at ${host}:${port} as ${user}...`);
  const connection = await mysql.createConnection({ host, port, user, password, database });
  console.log('MySQL connected!');

  // Find the first person in MySQL
  const [peopleRows]: any = await connection.query(
    "SELECT id, fullName, createdAt FROM people ORDER BY createdAt DESC LIMIT 1"
  );
  if (peopleRows.length === 0) {
    console.log('❌ No people found in MySQL.');
    await connection.end();
    return;
  }
  const testPerson = peopleRows[0];
  console.log('MySQL Test Person:', testPerson);

  // 2. Fetch pipelines and Admin user from Postgres
  const pipelines = await prisma.pipeline.findMany();
  const vendasPipeline = pipelines.find(p => p.name === 'Vendas');
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

  if (!vendasPipeline || !adminUser) {
    console.log('❌ Vendas pipeline or Admin user missing in Postgres.');
    await connection.end();
    return;
  }

  console.log('Vendas Pipeline:', vendasPipeline.id);
  console.log('Admin User:', adminUser.id);

  // 3. Create a claimed lead Customer record in Postgres
  console.log('\nCreating/updating customer record in Postgres...');
  
  // We use externalPersonId and journeyId to create/update
  // In PostgreSQL schema: @@unique([externalPersonId, journeyId])
  const customer = await prisma.customer.upsert({
    where: { externalPersonId_journeyId: { externalPersonId: testPerson.id, journeyId: 'null-placeholder-for-test' } },
    create: {
      id: 'test-customer-cuid',
      externalPersonId: testPerson.id,
      journeyId: null, // General claimed lead
      pipelineId: vendasPipeline.id,
      assigneeId: adminUser.id,
      stage: 'novo_cadastro',
    },
    update: {
      journeyId: null,
      pipelineId: vendasPipeline.id,
      assigneeId: adminUser.id,
      stage: 'novo_cadastro',
    }
  });
  console.log('Postgres Customer Created:', customer);

  // 4. Emulate the /api/leads GET logic exactly as implemented
  console.log('\n--- Emulating GET /api/leads query ---');

  const month = '2026-07'; // July 2026
  const pipelineId = vendasPipeline.id;
  const assigneeId = adminUser.id;
  const atendimentoFila = null; // Kanban mode
  const role = 'ADMIN';

  const crmFilter: any = {};
  const hasPipeline = pipelineId && pipelineId !== 'all';
  if (hasPipeline && !atendimentoFila) {
    crmFilter.pipelineId = pipelineId;
  }

  const hasAssignee = assigneeId && assigneeId !== 'all';
  if (hasAssignee) {
    crmFilter.assigneeId = assigneeId;
  }

  if (!atendimentoFila) {
    crmFilter.tag = { not: 'DISCARDED' };
  }

  console.log('Prisma crmFilter:', JSON.stringify(crmFilter, null, 2));

  // Query Postgres
  const matchingStates = await prisma.customer.findMany({
    where: crmFilter,
    select: { externalPersonId: true }
  });
  const matchingIds = Array.from(new Set(matchingStates.map(s => s.externalPersonId)));
  console.log('Postgres matchingIds:', matchingIds);
  console.log('Is our test person in matchingIds?', matchingIds.includes(testPerson.id));

  // Build MySQL query
  let whereClause = ' WHERE 1=1';
  const params: any[] = [];
  if (matchingIds.length > 0) {
    whereClause += ` AND p.id IN (?)`;
    params.push(matchingIds);
  }

  // Filter by date/month (MySQL)
  const hasMonthFilter = month && month !== 'all';
  if (month && month !== 'all') {
    if (atendimentoFila === 'cancelados') {
      whereClause += ` AND DATE_FORMAT(s.canceledAt, '%Y-%m') = ?`;
      params.push(month);
    } else if (atendimentoFila === 'expirar') {
      whereClause += ` AND DATE_FORMAT(COALESCE(s.isValidUntil, s.expiresIn), '%Y-%m') = ?`;
      params.push(month);
    } else if (atendimentoFila === 'abandonados') {
      whereClause += ` AND DATE_FORMAT(p.createdAt, '%Y-%m') = ?`;
      params.push(month);
    }
  }

  const fromAndJoin = `
    FROM people p
    LEFT JOIN subscriptions s ON s.personId = p.id
    LEFT JOIN plans pl ON s.planId = pl.id
  `;
  const selectFields = `
    p.id, 
    p.fullName, 
    p.email, 
    p.phoneNumber, 
    p.createdAt,
    pl.id as planId,
    pl.title as planTitle,
    pl.price as planPrice,
    pl.intervalType as planInterval,
    s.status as subStatus,
    s.canceledAt as subCanceledAt,
    s.expiresIn as subExpiresIn,
    s.isValidUntil as subIsValidUntil
  `;

  const mainQuery = `SELECT DISTINCT ${selectFields} ${fromAndJoin} ${whereClause} ORDER BY p.createdAt DESC LIMIT 1000 OFFSET 0`;
  console.log('Executing MySQL Query:', mainQuery);
  console.log('With params:', params);

  const [rows]: any = await connection.query(mainQuery, params);
  console.log('MySQL rows returned:', rows.length);
  const rowIds = rows.map((r: any) => r.id);
  console.log('Is our test person in MySQL results?', rowIds.includes(testPerson.id));

  // Clean up
  console.log('\nCleaning up Postgres test record...');
  await prisma.customer.delete({ where: { id: customer.id } });
  console.log('Cleaned up!');

  await connection.end();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

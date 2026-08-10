import 'dotenv/config';
import pool from '../src/lib/db';
import prisma from '../src/lib/prisma';

async function checkNoPlan() {
  console.log('=== Checking MySQL people table ===');
  
  try {
    const [allPeople]: any = await pool.query(`SELECT COUNT(*) as total FROM people WHERE admin = 0`);
    console.log('Total non-admin people in MySQL:', allPeople[0].total);

    const [noSubPeople]: any = await pool.query(`
      SELECT COUNT(DISTINCT p.id) as count
      FROM people p
      LEFT JOIN subscriptions s ON s.personId = p.id
      WHERE p.admin = 0
      AND (s.id IS NULL OR s.status = 'pending' OR NOT EXISTS (
        SELECT 1 FROM subscriptions s2 WHERE s2.personId = p.id AND s2.status IN ('active', 'expired', 'canceled')
      ))
    `);
    console.log('Total MySQL people without active/expired/canceled sub:', noSubPeople[0].count);

    const [noSubDatePeople]: any = await pool.query(`
      SELECT COUNT(DISTINCT p.id) as count
      FROM people p
      LEFT JOIN subscriptions s ON s.personId = p.id
      WHERE p.admin = 0
      AND p.createdAt >= '2024-10-01'
      AND p.createdAt <= '2026-08-10 23:59:59'
      AND (s.id IS NULL OR s.status = 'pending' OR NOT EXISTS (
        SELECT 1 FROM subscriptions s2 WHERE s2.personId = p.id AND s2.status IN ('active', 'expired', 'canceled')
      ))
    `);
    console.log('MySQL people created between 2024-10-01 and 2026-08-10 without sub:', noSubDatePeople[0].count);
  } catch (err: any) {
    console.error('MySQL Error:', err.message);
  }

  console.log('\n=== Checking Prisma Customer table ===');
  try {
    const totalCustomers = await prisma.customer.count();
    console.log('Total Prisma customers:', totalCustomers);

    const dentalGoCustomers = await prisma.customer.count({
      where: { source: 'DENTALGO' }
    });
    console.log('Total DENTALGO source customers in Prisma:', dentalGoCustomers);

    const noProductCustomers = await prisma.customer.count({
      where: {
        source: 'DENTALGO',
        customerProducts: { none: {} }
      }
    });
    console.log('Total DENTALGO customers with no customerProducts:', noProductCustomers);

    const noProductDateCustomers = await prisma.customer.count({
      where: {
        source: 'DENTALGO',
        createdAt: {
          gte: new Date('2024-10-01'),
          lte: new Date('2026-08-10T23:59:59.999Z')
        },
        customerProducts: { none: {} }
      }
    });
    console.log('DENTALGO customers created 2024-10-01 to 2026-08-10 with no customerProducts:', noProductDateCustomers);
  } catch (err: any) {
    console.error('Prisma Error:', err.message);
  }

  process.exit(0);
}

checkNoPlan().catch(err => {
  console.error(err);
  process.exit(1);
});

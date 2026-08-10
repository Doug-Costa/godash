import mysql from 'mysql2/promise';

const config = {
  host: '187.77.48.78',
  port: 3306,
  user: 'xkey',
  password: 'xkey@2026*',
  database: 'dentalgo_production',
  ssl: { rejectUnauthorized: false },
  connectTimeout: 25000,
};

async function check15DaysPlan() {
  console.log('=== Checking 15 Dias Grátis Plan in MySQL ===\n');

  let conn;
  try {
    conn = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL 187.77.48.78!\n');

    // 1. Find the plan ID
    const [plans]: any = await conn.query(`
      SELECT id, title, price, intervalType
      FROM plans
      WHERE LOWER(title) LIKE '%15%' OR LOWER(title) LIKE '%gratis%' OR LOWER(title) LIKE '%grátis%' OR LOWER(title) LIKE '%trial%'
    `);
    console.log('Matching plans found in plans table:');
    console.table(plans);

    if (plans.length === 0) {
      console.log('No plan title containing 15/gratis found. Listing all plans:');
      const [allPlans]: any = await conn.query(`SELECT id, title, price FROM plans ORDER BY title`);
      console.table(allPlans);
    }

    const planIds = plans.map((p: any) => p.id);
    if (planIds.length > 0) {
      const idsStr = planIds.map((id: string) => `'${id}'`).join(',');

      // 2. Count distinct people by subscription status
      const [statusBreakdown]: any = await conn.query(`
        SELECT 
          s.status,
          COUNT(*) as total_subscriptions,
          COUNT(DISTINCT s.personId) as distinct_people
        FROM subscriptions s
        WHERE s.planId IN (${idsStr})
        AND s.createdAt >= '2026-01-01'
        AND s.createdAt <= '2026-08-10 23:59:59'
        GROUP BY s.status
      `);
      console.log('\nSubscription status breakdown for dates 2026-01-01 to 2026-08-10:');
      console.table(statusBreakdown);

      // 3. Check for expired subscriptions (status = active but isValidUntil < now)
      const [expiredCheck]: any = await conn.query(`
        SELECT 
          COUNT(DISTINCT s.personId) as expired_active_people
        FROM subscriptions s
        WHERE s.planId IN (${idsStr})
        AND s.createdAt >= '2026-01-01'
        AND s.createdAt <= '2026-08-10 23:59:59'
        AND s.status = 'active'
        AND COALESCE(s.isValidUntil, s.expiresIn) < NOW()
      `);
      console.log('\nPeople with status = active BUT isValidUntil < NOW():', expiredCheck[0].expired_active_people);

      // 4. Total distinct people for all statuses combined
      const [totalAllStatuses]: any = await conn.query(`
        SELECT COUNT(DISTINCT s.personId) as total_distinct_people
        FROM subscriptions s
        WHERE s.planId IN (${idsStr})
        AND s.createdAt >= '2026-01-01'
        AND s.createdAt <= '2026-08-10 23:59:59'
      `);
      console.log('\nTotal DISTINCT people across ALL statuses for this plan:', totalAllStatuses[0].total_distinct_people);

      // 5. Sample subscriptions for this plan
      const [sampleSubs]: any = await conn.query(`
        SELECT s.id, s.personId, s.planId, s.status, s.isValidUntil, s.createdAt
        FROM subscriptions s
        WHERE s.planId IN (${idsStr})
        AND s.createdAt >= '2026-01-01'
        AND s.createdAt <= '2026-08-10 23:59:59'
        LIMIT 20
      `);
      console.log('\nSample subscriptions:');
      console.table(sampleSubs);
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  } finally {
    if (conn) await conn.end();
  }

  process.exit(0);
}

check15DaysPlan();

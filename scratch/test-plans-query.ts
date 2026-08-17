import pool from '../src/lib/db';

async function debugPlans() {
  console.log('=== DEBUGGING PLANS AND SUBSCRIPTIONS IN MYSQL ===\n');

  try {
    // 1. Get all plans and count subscriptions for each
    console.log('Fetching subscriptions count per plan from MySQL...');
    const [counts]: any = await pool.query(`
      SELECT 
        pl.id AS planId,
        pl.title AS planTitle,
        COUNT(s.id) AS totalSubscriptions,
        SUM(CASE WHEN s.status = 'active' THEN 1 ELSE 0 END) AS activeSubscriptions
      FROM plans pl
      LEFT JOIN subscriptions s ON s.planId = pl.id
      GROUP BY pl.id, pl.title
      HAVING totalSubscriptions > 0
      ORDER BY totalSubscriptions DESC
      LIMIT 15
    `);

    console.table(counts);

    if (counts.length === 0) {
      console.log('⚠️ No plans with subscriptions found in MySQL!');
      process.exit(0);
    }

    const testPlanId = counts[0].planId;
    const testPlanTitle = counts[0].planTitle;

    console.log(`\nTesting query for Plan ID: ${testPlanId} (${testPlanTitle})...`);

    const query = `
      SELECT 
        p.id AS personId,
        p.fullName,
        p.email,
        s.id AS subId,
        s.status AS subStatus,
        pl.title AS planTitle
      FROM people p
      JOIN subscriptions s ON s.personId = p.id
      JOIN plans pl ON s.planId = pl.id
      WHERE p.admin = 0
        AND pl.id = ?
      LIMIT 5
    `;

    const [rows]: any = await pool.query(query, [testPlanId]);
    console.log(`\nFound ${rows.length} rows for Plan ID ${testPlanId}:`);
    console.log(JSON.stringify(rows, null, 2));

  } catch (err: any) {
    console.error('❌ Error during debug:', err);
  }

  process.exit(0);
}

debugPlans();

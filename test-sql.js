require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function testAllQueries() {
  const config = {
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, ssl: { rejectUnauthorized: false }
  };

  try {
    const conn = await mysql.createConnection(config);
    console.log('Connected to DB');

    const queries = [
      { name: 'Q_SUMMARY_KPIS', sql: `SELECT (SELECT COUNT(*) FROM people WHERE admin = 0) AS totalUsers`, params: [] },
      { name: 'Q_USERS_BY_CATEGORY', sql: `SELECT SUM(CASE WHEN pl.title LIKE '%Anual%' OR pl.title LIKE '%Recorrente%' THEN 1 ELSE 0 END) AS coreUsers FROM subscriptions s INNER JOIN plans pl ON s.planId = pl.id WHERE s.status = 'active'`, params: [] },
      { name: 'Q_DAILY_REVENUE_SEGMENTED', sql: `SELECT DATE_FORMAT(p.createdAt, '%Y-%m-%d') AS period, SUM(p.total) as total FROM purchases p WHERE p.status = 'success' AND p.createdAt >= DATE_SUB(CURDATE(), INTERVAL 15 DAY) GROUP BY period`, params: [] }
    ];

    for (const q of queries) {
      try {
        console.log(`Testing ${q.name}...`);
        const [rows] = await conn.execute(q.sql, q.params);
        console.log(`${q.name}: SUCCESS (${rows.length} rows)`);
      } catch (err) {
        console.error(`${q.name}: FAILED - ${err.message}`);
      }
    }

    await conn.end();
  } catch (err) { console.error('Connection failed:', err); }
}
testAllQueries();

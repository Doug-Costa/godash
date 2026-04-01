require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function testChurnQueries() {
  const config = {
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, ssl: { rejectUnauthorized: false }
  };

  const Q_CHURN = `SELECT DATE_FORMAT(s.canceledAt, '%Y-%m') as month, COUNT(*) as canceled FROM subscriptions s JOIN plans pl ON s.planId = pl.id WHERE s.status = 'canceled' AND s.canceledAt >= DATE_SUB(CURDATE(), INTERVAL ? MONTH) AND (pl.title LIKE '%Anual%' OR pl.title LIKE '%Recorrente%') GROUP BY month ORDER BY month ASC`;
  const Q_ACTIVE = `SELECT DATE_FORMAT(s.createdAt, '%Y-%m') as month, COUNT(*) as newSubscriptions FROM subscriptions s JOIN plans pl ON s.planId = pl.id WHERE s.createdAt >= DATE_SUB(CURDATE(), INTERVAL ? MONTH) AND (pl.title LIKE '%Anual%' OR pl.title LIKE '%Recorrente%') GROUP BY month ORDER BY month ASC`;
  const Q_COHORT = `SELECT DATE_FORMAT(s.createdAt, '%Y-%m') AS cohort, COUNT(DISTINCT s.id) AS registered, COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) AS stillActive FROM subscriptions s INNER JOIN plans pl ON s.planId = pl.id WHERE (pl.title LIKE '%Anual%' OR pl.title LIKE '%Recorrente%') GROUP BY cohort DESC LIMIT 12`;

  try {
    const conn = await mysql.createConnection(config);
    console.log('Connected to DB');

    console.log('Testing Q_CHURN...');
    const [c] = await conn.execute(Q_CHURN, [12]);
    console.log('Q_CHURN: SUCCESS', c.length);

    console.log('Testing Q_ACTIVE...');
    const [a] = await conn.execute(Q_ACTIVE, [12]);
    console.log('Q_ACTIVE: SUCCESS', a.length);

    console.log('Testing Q_COHORT...');
    const [co] = await conn.execute(Q_COHORT);
    console.log('Q_COHORT: SUCCESS', co.length);

    await conn.end();
  } catch (err) { console.error('FAILED:', err.message); }
}
testChurnQueries();

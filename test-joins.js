require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function testExternalId() {
  const config = {
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, ssl: { rejectUnauthorized: false }
  };

  try {
    const conn = await mysql.createConnection(config);
    
    console.log('--- FINDING COMMON EXTERNAL IDs ---');
    const [matches] = await conn.query(`
      SELECT p.id as purId, s.id as subId, p.externalId, p.total, s.planId
      FROM purchases p
      JOIN subscriptions s ON p.externalId = s.externalId
      WHERE p.status = 'success'
      LIMIT 10
    `);
    console.log('Matches by externalId:', matches);

    if (matches.length === 0) {
      console.log('No matches by externalId. Trying by personId + Date proximity...');
      const [proximity] = await conn.query(`
        SELECT p.id as purId, s.id as subId, p.personId, p.total, s.planId, p.createdAt as purDate, s.createdAt as subDate
        FROM purchases p
        JOIN subscriptions s ON p.personId = s.personId 
          AND ABS(DATEDIFF(p.createdAt, s.createdAt)) < 2
        WHERE p.status = 'success'
        LIMIT 10
      `);
      console.log('Matches by personId and date proximity:', proximity);
    }

    await conn.end();
  } catch (err) { console.error(err); }
}
testExternalId();

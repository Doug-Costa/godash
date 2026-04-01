require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function debugSubscriptions() {
  const config = {
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, ssl: { rejectUnauthorized: false }
  };

  try {
    const conn = await mysql.createConnection(config);
    const [cols] = await conn.query('SHOW COLUMNS FROM subscriptions');
    console.log('Subscriptions Columns:', cols.map(c => c.Field).join(', '));
    const [samples] = await conn.query('SELECT * FROM subscriptions WHERE status = "active" LIMIT 5');
    console.log('Active Subscriptions:', JSON.stringify(samples, null, 2));
    await conn.end();
  } catch (err) { console.error(err); }
}
debugSubscriptions();

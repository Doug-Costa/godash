const mysql = require('mysql2/promise');
require('dotenv').config();

const sslEnabled = process.env.DB_SSL === 'true';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: sslEnabled ? { rejectUnauthorized: false } : undefined
});



async function inspect() {
  try {
    const [peopleCols] = await pool.query('DESCRIBE people');
    console.log('--- PEOPLE COLUMNS ---');
    console.log(peopleCols.map(c => `${c.Field} (${c.Type})`).join('\n'));

    const [tables] = await pool.query('SHOW TABLES');
    console.log('--- TABLES ---');
    console.log(tables.map(t => Object.values(t)[0]).join('\n'));

    process.exit(0);
  } catch (err) {
    console.error('Inspection failed:', err);
    process.exit(1);
  }
}

inspect();


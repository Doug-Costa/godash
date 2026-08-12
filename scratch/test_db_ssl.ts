import mysql from 'mysql2/promise';

async function testConnection(sslOption: boolean) {
  console.log(`Testing MySQL connection with DB_SSL=${sslOption}...`);
  try {
    const conn = await mysql.createConnection({
      host: '187.77.48.78',
      port: 3306,
      user: 'xkey',
      password: 'xkey@2026*',
      database: 'dentalgo_production',
      connectTimeout: 5000,
      ...(sslOption && { ssl: { rejectUnauthorized: false } })
    });
    console.log(`✅ SUCCESS with DB_SSL=${sslOption}!`);
    const [rows]: any = await conn.query('SELECT COUNT(*) AS total FROM people');
    console.log(`People count: ${rows[0].total}`);
    await conn.end();
  } catch (err: any) {
    console.error(`❌ FAILED with DB_SSL=${sslOption}: ${err.message}`);
  }
}

async function run() {
  await testConnection(false);
  await testConnection(true);
  process.exit(0);
}

run();

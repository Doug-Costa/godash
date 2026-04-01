require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function debugSchema() {
  const config = {
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, ssl: { rejectUnauthorized: false }
  };

  try {
    const conn = await mysql.createConnection(config);
    
    console.log('--- SUBSCRIPTIONS COLUMNS ---');
    const [subCols] = await conn.query('SHOW COLUMNS FROM subscriptions');
    subCols.forEach(c => console.log(c.Field));

    console.log('\n--- PURCHASES COLUMNS ---');
    const [purCols] = await conn.query('SHOW COLUMNS FROM purchases');
    purCols.forEach(c => console.log(c.Field));

    console.log('\n--- ATTEMPTING JOIN ---');
    // Check if there is a common column like 'subscription_id' in purchases or 'purchase_id' in subscriptions
    const subHasPur = subCols.some(c => c.Field.toLowerCase().includes('purchase'));
    const purHasSub = purCols.some(c => c.Field.toLowerCase().includes('sub'));
    
    console.log('Subscription has purchase related col:', subHasPur);
    console.log('Purchase has subscription related col:', purHasSub);

    if (purHasSub) {
      const subCol = purCols.find(c => c.Field.toLowerCase().includes('sub')).Field;
      const [joins] = await conn.query(`SELECT p.id as purId, p.total, p.${subCol} FROM purchases p WHERE p.${subCol} IS NOT NULL LIMIT 5`);
      console.log('Purchase-Sub joins:', joins);
    }

    await conn.end();
  } catch (err) { console.error(err); }
}
debugSchema();

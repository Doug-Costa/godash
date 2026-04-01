require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function listPlans() {
  const config = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  };

  try {
    const conn = await mysql.createConnection(config);
    const [rows] = await conn.query(`
      SELECT id, title, price, isManualPayment 
      FROM plans 
      WHERE title LIKE '%Dental GO%' 
         OR title LIKE '%SEOC%' 
         OR title LIKE '%SBTI%' 
         OR title LIKE '%SLM%' 
         OR title LIKE '%CIOSP%' 
         OR title LIKE '%Scholar%' 
         OR title LIKE '%JBCOMS%' 
         OR title LIKE '%SOBRAPI%'
      ORDER BY title ASC
    `);
    
    const fs = require('fs');
    fs.writeFileSync('plans_debug.json', JSON.stringify(rows, null, 2));
    console.log('Results saved to plans_debug.json');

    await conn.end();
  } catch (err) {
    console.error(err);
  }
}

listPlans();

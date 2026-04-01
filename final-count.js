require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function countPlanPurchases() {
  const config = {
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, ssl: { rejectUnauthorized: false }
  };

  try {
    const conn = await mysql.createConnection(config);
    
    const [counts] = await conn.query(`
      SELECT 
        CASE 
          WHEN pl.title LIKE '%Anual%' THEN 'Anual'
          WHEN pl.title LIKE '%Recorrente%' THEN 'Recorrente'
          ELSE 'Outro/Institucional'
        END as planType,
        COUNT(DISTINCT p.id) as purchaseCount,
        SUM(p.total) as totalCents
      FROM purchases p
      JOIN purchase_items pi ON p.id = pi.purchaseId
      JOIN product_items pit ON pi.productItemId = pit.id
      JOIN plans pl ON pit.productId = pl.id
      WHERE p.status = 'success'
      GROUP BY planType
    `);
    console.log('Purchases by plan category:', counts);

    const [salesCount] = await conn.query(`
      SELECT COUNT(*) as count, SUM(total) as totalCents
      FROM purchases p
      WHERE status = 'success'
        AND id NOT IN (
          SELECT purchaseId FROM purchase_items pi
          JOIN product_items pit ON pi.productItemId = pit.id
          JOIN plans pl ON pit.productId = pl.id
        )
    `);
    console.log('Loose sales count:', salesCount);

    await conn.end();
  } catch (err) { console.error(err); }
}
countPlanPurchases();

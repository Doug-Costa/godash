require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function checkProductPlanLink() {
  const config = {
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, ssl: { rejectUnauthorized: false }
  };

  try {
    const conn = await mysql.createConnection(config);
    
    console.log('--- CHECKING PRODUCT_ITEMS TO PLANS LINK ---');
    // See if any productId in product_items matches a plan id
    const [matches] = await conn.query(`
      SELECT pit.id as productItemId, pit.title as productTitle, pit.productId, pl.id as planId, pl.title as planTitle
      FROM product_items pit
      JOIN plans pl ON pit.productId = pl.id
      LIMIT 10
    `);
    console.log('Matches by productId = planId:', matches);

    if (matches.length === 0) {
      console.log('No matches by id. Trying by title...');
      const [titleMatches] = await conn.query(`
        SELECT pit.id as productItemId, pit.title as productTitle, pl.id as planId, pl.title as planTitle
        FROM product_items pit
        JOIN plans pl ON pit.title = pl.title
        LIMIT 10
      `);
      console.log('Matches by title:', titleMatches);
    }

    await conn.end();
  } catch (err) { console.error(err); }
}
checkProductPlanLink();

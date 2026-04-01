require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function debug() {
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
    
    console.log('--- TABLE SCHEMAS ---');
    const [purchasesCols] = await conn.query('SHOW COLUMNS FROM purchases');
    console.log('purchases:', purchasesCols.map(c => c.Field).join(', '));
    
    const [purchaseItemsCols] = await conn.query('SHOW COLUMNS FROM purchase_items');
    console.log('purchase_items:', purchaseItemsCols.map(c => c.Field).join(', '));
    
    const [productItemsCols] = await conn.query('SHOW COLUMNS FROM product_items');
    console.log('product_items:', productItemsCols.map(c => c.Field).join(', '));

    const [plansCols] = await conn.query('SHOW COLUMNS FROM plans');
    console.log('plans:', plansCols.map(c => c.Field).join(', '));

    console.log('\n--- DATA SAMPLES ---');
    const [purchaseItems] = await conn.query('SELECT * FROM purchase_items LIMIT 5');
    console.log('purchase_items samples:', purchaseItems);

    const [distinctTypes] = await conn.query('SELECT DISTINCT fileType FROM product_items');
    console.log('product_items fileTypes:', distinctTypes.map(t => t.fileType));

    // Check if there is a planId in product_items
    if (productItemsCols.some(c => c.Field === 'planId')) {
      const [planProducts] = await conn.query('SELECT id, title, planId FROM product_items WHERE planId IS NOT NULL LIMIT 5');
      console.log('product_items with planId:', planProducts);
    }

    // Try to find a purchase related to a plan
    const [planPurchases] = await conn.query(`
      SELECT p.id, p.total, pi.productItemId, pit.title, pit.fileType
      FROM purchases p
      JOIN purchase_items pi ON p.id = pi.purchaseId
      JOIN product_items pit ON pi.productItemId = pit.id
      WHERE p.status = 'success'
      LIMIT 10
    `);
    console.log('Recent purchases with product items:', planPurchases);

    await conn.end();
  } catch (err) {
    console.error(err);
  }
}

debug();

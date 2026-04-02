require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function analyze() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // 1. Find the 56 Core Subs in March 2026
    const [subs] = await c.query(`
      SELECT s.personId, pl.title, s.createdAt as subDate 
      FROM subscriptions s 
      JOIN plans pl ON s.planId = pl.id 
      WHERE (LOWER(pl.title) LIKE '%anual%' OR LOWER(pl.title) LIKE '%recorrente%') 
        AND DATE_FORMAT(s.createdAt, '%Y-%m') = '2026-03'
    `);

    let pureSub = 0;
    let bookBuyer = 0;

    for (const s of subs) {
      // Check if First Time (No prior core sub)
      const [prev] = await c.query('SELECT COUNT(*) as count FROM subscriptions WHERE personId = ? AND createdAt < ?', [s.personId, s.subDate]);
      
      if (prev[0].count === 0) {
        // This is one of the 17! Check their March items
        const [items] = await c.query(`
          SELECT pit.title 
          FROM purchases p 
          JOIN purchase_items pi ON p.id = pi.purchaseId 
          JOIN product_items pit ON pi.productItemId = pit.id 
          WHERE p.personId = ? 
            AND DATE_FORMAT(p.createdAt, '%Y-%m') = '2026-03'
        `, [s.personId]);

        const hasContent = items.some(i => 
          i.title.toLowerCase().includes('livro') || 
          i.title.toLowerCase().includes('digital') ||
          i.title.toLowerCase().includes('revista') ||
          i.title.toLowerCase().includes('artigo') ||
          i.title.length > 5 // Articles usually have long descriptive titles
        );

        if (hasContent) bookBuyer++;
        else pureSub++;
      }
    }

    console.log({ firstTimeTotal: pureSub + bookBuyer, pureSub, bookBuyer });

  } finally {
    await c.end();
  }
}

analyze();

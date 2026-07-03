const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
let env = {};
try {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split(/\r?\n/).forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let value = match[2] ? match[2].trim() : '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        env[match[1]] = value;
      }
    });
  }
} catch (e) {
  console.error('Failed to parse .env.local:', e.message);
}

async function main() {
  const host = env.DB_HOST || '127.0.0.1';
  const port = Number(env.DB_PORT) || 3306;
  const user = env.DB_USER || 'root';
  const password = env.DB_PASSWORD || '';
  const database = env.DB_NAME || 'dentalgo_production';

  console.log(`Connecting to database at ${host}:${port} as ${user}...`);

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
  });

  console.log('✅ Connection established!');

  const targetMonth = '2026-06';
  const query = `
    SELECT 
      p.id, 
      p.fullName, 
      p.email, 
      p.phoneNumber, 
      p.createdAt,
      pl.id as planId,
      pl.title as planTitle,
      pl.price as planPrice,
      pl.intervalType as planInterval
    FROM people p
    LEFT JOIN subscriptions s ON s.personId = p.id 
      AND s.createdAt <= LAST_DAY(CONCAT(?, '-01')) 
      AND (s.canceledAt IS NULL OR s.canceledAt > LAST_DAY(CONCAT(?, '-01')))
    LEFT JOIN plans pl ON s.planId = pl.id
    WHERE 1=1
    AND DATE_FORMAT(p.createdAt, '%Y-%m') = ?
    LIMIT 10
  `;

  console.log('Executing query with parameters:', [targetMonth, targetMonth, targetMonth]);
  
  try {
    const [rows] = await connection.query(query, [targetMonth, targetMonth, targetMonth]);
    console.log(`🎉 Query run completed! Rows returned: ${rows.length}`);
    if (rows.length > 0) {
      console.log('First row sample:', JSON.stringify(rows[0], null, 2));
    } else {
      console.log('No rows returned. Checking if any users exist at all in people table...');
      const [allUsers] = await connection.query('SELECT COUNT(*) as count FROM people');
      console.log('Total people in database:', allUsers[0].count);
      
      const [recentUsers] = await connection.query('SELECT createdAt FROM people ORDER BY createdAt DESC LIMIT 5');
      console.log('Most recent users registered at:', recentUsers.map(r => r.createdAt));
    }
  } catch (err) {
    console.error('❌ Query execution failed:', err);
  } finally {
    await connection.end();
  }
}

main().catch(err => {
  console.error('❌ Diagnostic error:', err);
});

import mysql from 'mysql2/promise';

const sslEnabled = process.env.DB_SSL === 'true';

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dental',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // DigitalOcean Managed MySQL requires SSL
  ...(sslEnabled && {
    ssl: {
      rejectUnauthorized: false,
    },
  }),
});

// Test connection on startup for Docker logs
if (typeof window === 'undefined') {
  pool.getConnection().then(conn => {
    console.log('✅ DB Connected Successfully in Docker (Target:', process.env.DB_HOST, ')');
    conn.release();
  }).catch(err => {
    console.error('❌ DB Connection Failed in Docker:', err.message);
  });
}

export default pool;

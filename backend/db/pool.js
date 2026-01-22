const { Pool } = require('pg');
require('dotenv').config();

// SSL configuration for cloud databases
// Support both formats: DB_SSL or sslmode from .env
const sslMode = process.env.DB_SSL || process.env.sslmode;
const sslConfig = (sslMode === 'require' || sslMode === 'true' || sslMode === '1')
  ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
  : false;

// Support both formats: DB_* or lowercase from .env
const pool = new Pool({
  user: process.env.DB_USER || process.env.username,
  host: process.env.DB_HOST || process.env.host,
  database: process.env.DB_NAME || process.env.database,
  password: process.env.DB_PASSWORD || process.env.password,
  port: process.env.DB_PORT || process.env.port || 5432,
  ssl: sslConfig,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', err => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;

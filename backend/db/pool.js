const { Pool } = require('pg');
const path = require('path');

// Load .env file explicitly from the backend directory
const dotenvResult = require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Use parsed result directly to avoid Windows case-insensitivity issues
// On Windows, process.env.username gets the system USERNAME variable, not the one from .env
const envConfig = dotenvResult.parsed || {};

// SSL configuration for cloud databases
// Support both formats: DB_SSL or sslmode from .env
const sslMode = process.env.DB_SSL || envConfig.DB_SSL || process.env.sslmode || envConfig.sslmode;
const sslConfig = (sslMode === 'require' || sslMode === 'true' || sslMode === '1')
  ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
  : false;

// Support both formats: DB_* or lowercase from .env
// Use envConfig first to avoid Windows env var conflicts
const pool = new Pool({
  user: process.env.DB_USER || envConfig.DB_USER || process.env.username || envConfig.username,
  host: process.env.DB_HOST || envConfig.DB_HOST || process.env.host || envConfig.host,
  database: process.env.DB_NAME || envConfig.DB_NAME || process.env.database || envConfig.database,
  password: process.env.DB_PASSWORD || envConfig.DB_PASSWORD || process.env.password || envConfig.password,
  port: process.env.DB_PORT || envConfig.DB_PORT || process.env.port || envConfig.port || 5432,
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

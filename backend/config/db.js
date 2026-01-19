const { Pool } = require('pg');
require('dotenv').config();

// SSL configuration for cloud databases
const sslConfig = process.env.DB_SSL === 'true' || process.env.DB_SSL === '1' 
  ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
  : false;

// ULTRA-CONSERVATIVE connection pool settings to prevent exhaustion
// Most PostgreSQL databases have max_connections = 100
// We use 20 to leave plenty of room for other services, admin tools, and overhead
// This ensures we NEVER hit the database connection limit
const DEFAULT_POOL_MAX = 20;
const POOL_MAX = parseInt(process.env.DB_POOL_MAX) || DEFAULT_POOL_MAX;

// Hard cap at 20 connections - this is the MAXIMUM we will ever use
// This leaves 80+ connections for other services even if DB limit is 100
const SAFE_POOL_MAX = Math.min(POOL_MAX, 20); // Hard cap at 20 - NEVER exceed this

console.log(`[DB Pool] Initialized with max connections: ${SAFE_POOL_MAX} (hard limit - will NEVER exceed this)`);

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'athlinked',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: sslConfig,
  max: SAFE_POOL_MAX, // ULTRA-CONSERVATIVE: 20 connections MAX (hard limit)
  idleTimeoutMillis: 3000, // VERY aggressive: release idle connections after 3 seconds
  connectionTimeoutMillis: 2000, // 2 second timeout - fail fast if pool is full
  allowExitOnIdle: true, // Allow process to exit when pool is idle
  min: 0, // Don't keep connections alive - create on demand
  // Query timeout to prevent hanging queries
  statement_timeout: 20000, // 20 second statement timeout
});

pool.on('connect', () => {
  // Database connected
});

pool.on('error', err => {
  console.error('Unexpected error on idle database client:', err);
  // Don't exit process on connection errors - let the pool handle reconnection
  // Only log the error for monitoring
  if (err.code === '57P01' || err.message.includes('terminating connection')) {
    console.warn('Database connection terminated, pool will attempt to reconnect');
  }
  // Log pool stats for debugging
  if (err.message && err.message.includes('remaining connection slots')) {
    console.error('⚠️ CONNECTION POOL EXHAUSTED!', {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
      maxConnections: SAFE_POOL_MAX,
      error: err.message,
    });
    console.error('⚠️ ACTION REQUIRED: Restart backend server to clear leaked connections');
  }
});

// Aggressive connection pool monitoring and cleanup
setInterval(() => {
  const stats = {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
    max: SAFE_POOL_MAX,
    usagePercent: ((pool.totalCount / SAFE_POOL_MAX) * 100).toFixed(1),
  };
  
  // Warn if pool usage is high (more than 60% = 12 connections)
  if (stats.total > 12) {
    console.warn('⚠️ [DB Pool Stats] High usage:', stats);
  } else if (process.env.NODE_ENV === 'development') {
    console.log('[DB Pool Stats]', stats);
  }
  
  // CRITICAL: If pool is nearly exhausted, log error
  if (stats.total >= SAFE_POOL_MAX - 2) {
    console.error('🚨 [DB Pool] CRITICAL: Pool nearly exhausted!', stats);
    console.error('🚨 [DB Pool] ACTION REQUIRED: Restart backend server immediately');
    console.error('🚨 [DB Pool] Current usage:', `${stats.usagePercent}% (${stats.total}/${SAFE_POOL_MAX})`);
  }
  
  // If there are waiting requests, that's a problem
  if (stats.waiting > 0) {
    console.error('🚨 [DB Pool] Requests are waiting for connections!', stats);
    console.error('🚨 [DB Pool] This indicates connection leaks or pool too small');
  }
}, 10000); // Check every 10 seconds (more frequent monitoring)

// Helper function to execute queries with timeout
pool.queryWithTimeout = async function(text, params, timeoutMs = 10000) {
  const client = await this.connect();
  try {
    // Set statement timeout for this query
    await client.query(`SET statement_timeout = ${timeoutMs}`);
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

module.exports = pool;

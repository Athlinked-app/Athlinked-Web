const { Pool, types } = require('pg');
require('dotenv').config();

// Override timestamp parsing to return UTC strings instead of local Date objects
// Type OID 1114 = TIMESTAMP WITHOUT TIME ZONE
// Type OID 1184 = TIMESTAMP WITH TIME ZONE
const TIMESTAMP_OID = 1114;
const TIMESTAMPTZ_OID = 1184;

// Return timestamps as ISO strings in UTC (don't convert to local time)
types.setTypeParser(TIMESTAMP_OID, (val) => val);
types.setTypeParser(TIMESTAMPTZ_OID, (val) => val);

// SSL configuration for cloud databases
const sslConfig = process.env.DB_SSL === 'true' || process.env.DB_SSL === '1' 
  ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
  : false;

// Connection pool settings to prevent exhaustion
// Most PostgreSQL databases have max_connections = 100
// We use 30 to leave room for other services, admin tools, and overhead
// This ensures we don't hit the database connection limit
const DEFAULT_POOL_MAX = 30;
const POOL_MAX = parseInt(process.env.DB_POOL_MAX) || DEFAULT_POOL_MAX;

// Cap at 30 connections - reasonable limit that leaves 70+ connections for other services
// If you need more, increase DB_POOL_MAX environment variable
const SAFE_POOL_MAX = Math.min(POOL_MAX, 50); // Cap at 50 max to prevent abuse

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: sslConfig,
  max: SAFE_POOL_MAX, // Max connections (default: 30, configurable via DB_POOL_MAX)
  idleTimeoutMillis: 10000, // Release idle connections after 10 seconds
  connectionTimeoutMillis: 5000, // 5 second timeout - fail fast if pool is full
  allowExitOnIdle: true, // Allow process to exit when pool is idle
  min: 2, // Keep 2 connections alive for faster response
  // Query timeout to prevent hanging queries
  statement_timeout: 30000, // 30 second statement timeout
});

pool.on('connect', (client) => {
  // Set timezone to UTC for consistent timestamp handling
  client.query('SET timezone = \'UTC\'');
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

// Connection pool monitoring - only log when there are issues
setInterval(() => {
  const stats = {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
    max: SAFE_POOL_MAX,
    usagePercent: ((pool.totalCount / SAFE_POOL_MAX) * 100).toFixed(1),
  };
  
  // Only log if there are issues - don't spam logs with normal operation
  // Warn if pool usage is high (more than 60% of max)
  const warningThreshold = Math.floor(SAFE_POOL_MAX * 0.6);
  if (stats.total > warningThreshold) {
    console.warn('⚠️ [DB Pool] High usage:', stats);
  }
  
  // CRITICAL: If pool is nearly exhausted, log error
  if (stats.total >= SAFE_POOL_MAX - 2) {
    console.error('🚨 [DB Pool] CRITICAL: Pool nearly exhausted!', stats);
    console.error('🚨 [DB Pool] ACTION REQUIRED: Check for connection leaks or increase DB_POOL_MAX');
    console.error('🚨 [DB Pool] Current usage:', `${stats.usagePercent}% (${stats.total}/${SAFE_POOL_MAX})`);
  }
  
  // If there are waiting requests, that's a problem
  if (stats.waiting > 0) {
    console.error('🚨 [DB Pool] Requests are waiting for connections!', stats);
    console.error('🚨 [DB Pool] This indicates connection leaks or pool too small');
  }
}, 10000); // Check every 10 seconds

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

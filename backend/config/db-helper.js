const pool = require('./db');

/**
 * Execute a query with automatic retry on connection errors
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @param {number} retries - Number of retries (default: 2)
 * @returns {Promise} Query result
 */
async function queryWithRetry(text, params = [], retries = 2) {
  let lastError;
  
  for (let i = 0; i <= retries; i++) {
    try {
      const result = await pool.query(text, params);
      return result;
    } catch (error) {
      lastError = error;
      
      // Check if it's a connection-related error
      if (
        error.message &&
        (error.message.includes('remaining connection slots') ||
         error.message.includes('connection') ||
         error.code === '57P01' ||
         error.code === '53300')
      ) {
        if (i < retries) {
          // Wait before retrying (exponential backoff)
          const waitTime = Math.min(1000 * Math.pow(2, i), 5000);
          console.warn(`Connection error, retrying in ${waitTime}ms... (attempt ${i + 1}/${retries + 1})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }
      
      // If it's not a connection error or we've exhausted retries, throw
      throw error;
    }
  }
  
  throw lastError;
}

/**
 * Get a client from the pool with timeout and retry
 * @param {number} timeoutMs - Timeout in milliseconds (default: 5000)
 * @param {number} retries - Number of retries (default: 1)
 * @returns {Promise} Database client
 */
async function getClientWithRetry(timeoutMs = 5000, retries = 1) {
  let lastError;
  
  for (let i = 0; i <= retries; i++) {
    try {
      // Create a promise that rejects after timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), timeoutMs);
      });
      
      const clientPromise = pool.connect();
      const client = await Promise.race([clientPromise, timeoutPromise]);
      return client;
    } catch (error) {
      lastError = error;
      
      if (
        error.message &&
        (error.message.includes('remaining connection slots') ||
         error.message.includes('connection') ||
         error.code === '57P01')
      ) {
        if (i < retries) {
          const waitTime = Math.min(1000 * Math.pow(2, i), 3000);
          console.warn(`Failed to get client, retrying in ${waitTime}ms... (attempt ${i + 1}/${retries + 1})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }
      
      throw error;
    }
  }
  
  throw lastError;
}

module.exports = {
  queryWithRetry,
  getClientWithRetry,
};

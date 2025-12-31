const pool = require('../config/db');

/**
 * Store a refresh token in the database
 * @param {string} userId - User ID
 * @param {string} token - Refresh token string
 * @param {Date} expiresAt - Expiration date
 * @param {string} deviceInfo - Optional device information
 * @param {string} ipAddress - Optional IP address
 * @returns {Promise<object>} Created refresh token record
 */
async function storeRefreshToken(
  userId,
  token,
  expiresAt,
  deviceInfo = null,
  ipAddress = null
) {
  const query = `
    INSERT INTO refresh_tokens (user_id, token, expires_at, device_info, ip_address)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const values = [userId, token, expiresAt, deviceInfo, ipAddress];
  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Find a refresh token by token string
 * @param {string} token - Refresh token string
 * @returns {Promise<object|null>} Refresh token record or null
 */
async function findRefreshToken(token) {
  const query = `
    SELECT * FROM refresh_tokens
    WHERE token = $1
    AND revoked_at IS NULL
    AND expires_at > CURRENT_TIMESTAMP
  `;

  const result = await pool.query(query, [token]);
  return result.rows[0] || null;
}

/**
 * Revoke a refresh token
 * @param {string} token - Refresh token string
 * @returns {Promise<boolean>} True if token was revoked
 */
async function revokeRefreshToken(token) {
  const query = `
    UPDATE refresh_tokens
    SET revoked_at = CURRENT_TIMESTAMP
    WHERE token = $1
    AND revoked_at IS NULL
    RETURNING *
  `;

  const result = await pool.query(query, [token]);
  return result.rows.length > 0;
}

/**
 * Revoke all refresh tokens for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of tokens revoked
 */
async function revokeAllUserTokens(userId) {
  const query = `
    UPDATE refresh_tokens
    SET revoked_at = CURRENT_TIMESTAMP
    WHERE user_id = $1
    AND revoked_at IS NULL
    RETURNING *
  `;

  const result = await pool.query(query, [userId]);
  return result.rows.length;
}

/**
 * Delete expired refresh tokens (cleanup)
 * @returns {Promise<number>} Number of tokens deleted
 */
async function deleteExpiredTokens() {
  const query = `
    DELETE FROM refresh_tokens
    WHERE expires_at < CURRENT_TIMESTAMP
    OR revoked_at IS NOT NULL
    RETURNING *
  `;

  const result = await pool.query(query);
  return result.rows.length;
}

/**
 * Get all active refresh tokens for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of active refresh tokens
 */
async function getUserRefreshTokens(userId) {
  const query = `
    SELECT * FROM refresh_tokens
    WHERE user_id = $1
    AND revoked_at IS NULL
    AND expires_at > CURRENT_TIMESTAMP
    ORDER BY created_at DESC
  `;

  const result = await pool.query(query, [userId]);
  return result.rows;
}

module.exports = {
  storeRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  deleteExpiredTokens,
  getUserRefreshTokens,
};

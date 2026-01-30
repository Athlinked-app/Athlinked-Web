const pool = require('../config/db');

/**
 * Register or update an FCM token for a user
 * @param {string} userId - User ID
 * @param {string} fcmToken - FCM token string
 * @param {string} platform - Platform (ios, android, web)
 * @returns {Promise<object>} Created or updated FCM token record
 */
async function registerToken(userId, fcmToken, platform) {
  // First, check if token already exists for this user
  const checkQuery = `
    SELECT id, user_id, token, platform, updated_at
    FROM fcm_tokens
    WHERE user_id = $1 AND token = $2
  `;

  try {
    const existingToken = await pool.query(checkQuery, [userId, fcmToken]);

    if (existingToken.rows.length > 0) {
      // Token exists, update the updated_at timestamp
      const updateQuery = `
        UPDATE fcm_tokens
        SET updated_at = NOW(), platform = $3
        WHERE user_id = $1 AND token = $2
        RETURNING *
      `;
      const result = await pool.query(updateQuery, [userId, fcmToken, platform]);
      return result.rows[0];
    } else {
      // Token doesn't exist, insert a new row
      const insertQuery = `
        INSERT INTO fcm_tokens (user_id, token, platform, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING *
      `;
      const result = await pool.query(insertQuery, [userId, fcmToken, platform]);
      return result.rows[0];
    }
  } catch (error) {
    console.error('Error registering FCM token:', error);
    throw error;
  }
}

/**
 * Get all FCM tokens for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of FCM token records
 */
async function getUserTokens(userId) {
  const query = `
    SELECT id, user_id, token, platform, created_at, updated_at
    FROM fcm_tokens
    WHERE user_id = $1
    ORDER BY updated_at DESC
  `;

  try {
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching user FCM tokens:', error);
    throw error;
  }
}

/**
 * Get FCM tokens for sending notifications (only active tokens)
 * @param {string} userId - User ID
 * @returns {Promise<Array<string>>} Array of FCM token strings
 */
async function getUserTokensForNotification(userId) {
  const query = `
    SELECT token
    FROM fcm_tokens
    WHERE user_id = $1
    ORDER BY updated_at DESC
  `;

  try {
    const result = await pool.query(query, [userId]);
    return result.rows.map(row => row.token);
  } catch (error) {
    console.error('Error fetching user FCM tokens for notification:', error);
    throw error;
  }
}

/**
 * Remove an FCM token (when user logs out or uninstalls app)
 * @param {string} userId - User ID
 * @param {string} fcmToken - FCM token to remove
 * @returns {Promise<boolean>} True if token was deleted, false if not found
 */
async function removeToken(userId, fcmToken) {
  const query = `
    DELETE FROM fcm_tokens
    WHERE user_id = $1 AND token = $2
    RETURNING id
  `;

  try {
    const result = await pool.query(query, [userId, fcmToken]);
    return result.rowCount > 0;
  } catch (error) {
    console.error('Error removing FCM token:', error);
    throw error;
  }
}

/**
 * Remove all tokens for a user (when user logs out from all devices)
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of tokens removed
 */
async function removeAllUserTokens(userId) {
  const query = `
    DELETE FROM fcm_tokens
    WHERE user_id = $1
    RETURNING id
  `;

  try {
    const result = await pool.query(query, [userId]);
    return result.rowCount;
  } catch (error) {
    console.error('Error removing all user FCM tokens:', error);
    throw error;
  }
}

/**
 * Clean up invalid tokens (called after failed notification sends)
 * @param {Array<string>} invalidTokens - Array of invalid token strings
 * @returns {Promise<number>} Number of tokens removed
 */
async function removeInvalidTokens(invalidTokens) {
  if (!invalidTokens || invalidTokens.length === 0) {
    return 0;
  }

  const query = `
    DELETE FROM fcm_tokens
    WHERE token = ANY($1::text[])
    RETURNING id
  `;

  try {
    const result = await pool.query(query, [invalidTokens]);
    return result.rowCount;
  } catch (error) {
    console.error('Error removing invalid FCM tokens:', error);
    throw error;
  }
}

module.exports = {
  registerToken,
  getUserTokens,
  getUserTokensForNotification,
  removeToken,
  removeAllUserTokens,
  removeInvalidTokens,
};

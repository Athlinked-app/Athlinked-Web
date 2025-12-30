const pool = require('../config/db');

/**
 * Get all social handles for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of social handles
 */
async function getSocialHandlesByUserId(userId) {
  const query = `
    SELECT 
      id,
      user_id,
      platform,
      url,
      created_at,
      updated_at
    FROM social_handles
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;

  try {
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching social handles:', error);
    throw error;
  }
}

/**
 * Create a new social handle
 * @param {string} userId - User ID
 * @param {string} platform - Platform name (e.g., 'Facebook', 'Instagram')
 * @param {string} url - Social handle URL
 * @returns {Promise<object>} Created social handle
 */
async function createSocialHandle(userId, platform, url) {
  const query = `
    INSERT INTO social_handles (user_id, platform, url)
    VALUES ($1, $2, $3)
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [userId, platform, url]);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating social handle:', error);
    throw error;
  }
}

/**
 * Update a social handle
 * @param {string} id - Social handle ID
 * @param {string} platform - Platform name
 * @param {string} url - Social handle URL
 * @returns {Promise<object>} Updated social handle
 */
async function updateSocialHandle(id, platform, url) {
  const query = `
    UPDATE social_handles
    SET platform = $1, url = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [platform, url, id]);
    if (result.rows.length === 0) {
      throw new Error('Social handle not found');
    }
    return result.rows[0];
  } catch (error) {
    console.error('Error updating social handle:', error);
    throw error;
  }
}

/**
 * Delete a social handle
 * @param {string} id - Social handle ID
 * @returns {Promise<boolean>} True if deleted successfully
 */
async function deleteSocialHandle(id) {
  const query = `
    DELETE FROM social_handles
    WHERE id = $1
    RETURNING id
  `;

  try {
    const result = await pool.query(query, [id]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error deleting social handle:', error);
    throw error;
  }
}

module.exports = {
  getSocialHandlesByUserId,
  createSocialHandle,
  updateSocialHandle,
  deleteSocialHandle,
};


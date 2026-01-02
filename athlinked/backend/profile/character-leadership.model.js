const pool = require('../config/db');

/**
 * Get all character and leadership data for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of character and leadership data
 */
async function getCharacterLeadershipByUserId(userId) {
  const query = `
    SELECT 
      id,
      user_id,
      team_captain,
      leadership_roles,
      languages_spoken,
      community_service,
      created_at,
      updated_at
    FROM character_leadership
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;

  try {
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching character and leadership:', error);
    throw error;
  }
}

/**
 * Create a new character and leadership entry
 * @param {string} userId - User ID
 * @param {object} data - Character and leadership data
 * @returns {Promise<object>} Created character and leadership entry
 */
async function createCharacterLeadership(userId, data) {
  const query = `
    INSERT INTO character_leadership (
      user_id,
      team_captain,
      leadership_roles,
      languages_spoken,
      community_service
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  // Convert languages array to PostgreSQL array format
  const languagesArray = Array.isArray(data.languagesSpoken)
    ? data.languagesSpoken
    : [];

  const values = [
    userId,
    data.teamCaptain || null,
    data.leadershipRoles || null,
    languagesArray.length > 0 ? languagesArray : null,
    data.communityService || null,
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating character and leadership:', error);
    throw error;
  }
}

/**
 * Update a character and leadership entry
 * @param {string} id - Character and leadership ID
 * @param {object} data - Character and leadership data
 * @returns {Promise<object>} Updated character and leadership entry
 */
async function updateCharacterLeadership(id, data) {
  const updateFields = [];
  const values = [];
  let paramIndex = 1;

  if (data.teamCaptain !== undefined) {
    updateFields.push(`team_captain = $${paramIndex++}`);
    values.push(data.teamCaptain || null);
  }
  if (data.leadershipRoles !== undefined) {
    updateFields.push(`leadership_roles = $${paramIndex++}`);
    values.push(data.leadershipRoles || null);
  }
  if (data.languagesSpoken !== undefined) {
    updateFields.push(`languages_spoken = $${paramIndex++}`);
    const languagesArray = Array.isArray(data.languagesSpoken)
      ? data.languagesSpoken
      : [];
    values.push(languagesArray.length > 0 ? languagesArray : null);
  }
  if (data.communityService !== undefined) {
    updateFields.push(`community_service = $${paramIndex++}`);
    values.push(data.communityService || null);
  }

  if (updateFields.length === 0) {
    throw new Error('No fields to update');
  }

  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const query = `
    UPDATE character_leadership
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Character and leadership entry not found');
    }
    return result.rows[0];
  } catch (error) {
    console.error('Error updating character and leadership:', error);
    throw error;
  }
}

/**
 * Delete a character and leadership entry
 * @param {string} id - Character and leadership ID
 * @returns {Promise<boolean>} True if deleted successfully
 */
async function deleteCharacterLeadership(id) {
  const query = `
    DELETE FROM character_leadership
    WHERE id = $1
    RETURNING id
  `;

  try {
    const result = await pool.query(query, [id]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error deleting character and leadership:', error);
    throw error;
  }
}

module.exports = {
  getCharacterLeadershipByUserId,
  createCharacterLeadership,
  updateCharacterLeadership,
  deleteCharacterLeadership,
};

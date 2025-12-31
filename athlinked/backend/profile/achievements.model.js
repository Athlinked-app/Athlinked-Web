const pool = require('../config/db');

/**
 * Get all achievements for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of achievements
 */
async function getAchievementsByUserId(userId) {
  const query = `
    SELECT 
      id,
      user_id,
      title,
      organization,
      date_awarded,
      sport,
      position_event,
      achievement_type,
      level,
      location,
      description,
      media_pdf,
      created_at,
      updated_at
    FROM achievements
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;

  try {
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching achievements:', error);
    throw error;
  }
}

/**
 * Create a new achievement
 * @param {string} userId - User ID
 * @param {object} data - Achievement data
 * @returns {Promise<object>} Created achievement
 */
async function createAchievement(userId, data) {
  const query = `
    INSERT INTO achievements (
      user_id,
      title,
      organization,
      date_awarded,
      sport,
      position_event,
      achievement_type,
      level,
      location,
      description,
      media_pdf
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;

  const values = [
    userId,
    data.title || null,
    data.organization || null,
    data.dateAwarded || null,
    data.sport || null,
    data.positionEvent || null,
    data.achievementType || null,
    data.level || null,
    data.location || null,
    data.description || null,
    data.mediaPdf || null,
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating achievement:', error);
    throw error;
  }
}

/**
 * Update an achievement
 * @param {string} id - Achievement ID
 * @param {object} data - Achievement data
 * @returns {Promise<object>} Updated achievement
 */
async function updateAchievement(id, data) {
  const updateFields = [];
  const values = [];
  let paramIndex = 1;

  if (data.title !== undefined) {
    updateFields.push(`title = $${paramIndex++}`);
    values.push(data.title || null);
  }
  if (data.organization !== undefined) {
    updateFields.push(`organization = $${paramIndex++}`);
    values.push(data.organization || null);
  }
  if (data.dateAwarded !== undefined) {
    updateFields.push(`date_awarded = $${paramIndex++}`);
    values.push(data.dateAwarded || null);
  }
  if (data.sport !== undefined) {
    updateFields.push(`sport = $${paramIndex++}`);
    values.push(data.sport || null);
  }
  if (data.positionEvent !== undefined) {
    updateFields.push(`position_event = $${paramIndex++}`);
    values.push(data.positionEvent || null);
  }
  if (data.achievementType !== undefined) {
    updateFields.push(`achievement_type = $${paramIndex++}`);
    values.push(data.achievementType || null);
  }
  if (data.level !== undefined) {
    updateFields.push(`level = $${paramIndex++}`);
    values.push(data.level || null);
  }
  if (data.location !== undefined) {
    updateFields.push(`location = $${paramIndex++}`);
    values.push(data.location || null);
  }
  if (data.description !== undefined) {
    updateFields.push(`description = $${paramIndex++}`);
    values.push(data.description || null);
  }
  if (data.mediaPdf !== undefined) {
    updateFields.push(`media_pdf = $${paramIndex++}`);
    values.push(data.mediaPdf || null);
  }

  if (updateFields.length === 0) {
    throw new Error('No fields to update');
  }

  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const query = `
    UPDATE achievements
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Achievement not found');
    }
    return result.rows[0];
  } catch (error) {
    console.error('Error updating achievement:', error);
    throw error;
  }
}

/**
 * Delete an achievement
 * @param {string} id - Achievement ID
 * @returns {Promise<boolean>} True if deleted successfully
 */
async function deleteAchievement(id) {
  const query = `
    DELETE FROM achievements
    WHERE id = $1
    RETURNING id
  `;

  try {
    const result = await pool.query(query, [id]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error deleting achievement:', error);
    throw error;
  }
}

module.exports = {
  getAchievementsByUserId,
  createAchievement,
  updateAchievement,
  deleteAchievement,
};

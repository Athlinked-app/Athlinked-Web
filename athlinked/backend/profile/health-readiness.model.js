const pool = require('../config/db');

/**
 * Get all health and readiness data for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of health and readiness data
 */
async function getHealthReadinessByUserId(userId) {
  const query = `
    SELECT 
      id,
      user_id,
      injury_history,
      resting_heart_rate,
      endurance_metric,
      created_at,
      updated_at
    FROM health_readiness
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;

  try {
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching health and readiness:', error);
    throw error;
  }
}

/**
 * Create a new health and readiness entry
 * @param {string} userId - User ID
 * @param {object} data - Health and readiness data
 * @returns {Promise<object>} Created health and readiness entry
 */
async function createHealthReadiness(userId, data) {
  const query = `
    INSERT INTO health_readiness (
      user_id,
      injury_history,
      resting_heart_rate,
      endurance_metric
    ) VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  const values = [
    userId,
    data.injuryHistory || null,
    data.restingHeartRate || null,
    data.enduranceMetric || null,
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating health and readiness:', error);
    throw error;
  }
}

/**
 * Update a health and readiness entry
 * @param {string} id - Health and readiness ID
 * @param {object} data - Health and readiness data
 * @returns {Promise<object>} Updated health and readiness entry
 */
async function updateHealthReadiness(id, data) {
  const updateFields = [];
  const values = [];
  let paramIndex = 1;

  if (data.injuryHistory !== undefined) {
    updateFields.push(`injury_history = $${paramIndex++}`);
    values.push(data.injuryHistory || null);
  }
  if (data.restingHeartRate !== undefined) {
    updateFields.push(`resting_heart_rate = $${paramIndex++}`);
    values.push(data.restingHeartRate || null);
  }
  if (data.enduranceMetric !== undefined) {
    updateFields.push(`endurance_metric = $${paramIndex++}`);
    values.push(data.enduranceMetric || null);
  }

  if (updateFields.length === 0) {
    throw new Error('No fields to update');
  }

  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const query = `
    UPDATE health_readiness
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Health and readiness entry not found');
    }
    return result.rows[0];
  } catch (error) {
    console.error('Error updating health and readiness:', error);
    throw error;
  }
}

/**
 * Delete a health and readiness entry
 * @param {string} id - Health and readiness ID
 * @returns {Promise<boolean>} True if deleted successfully
 */
async function deleteHealthReadiness(id) {
  const query = `
    DELETE FROM health_readiness
    WHERE id = $1
    RETURNING id
  `;

  try {
    const result = await pool.query(query, [id]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error deleting health and readiness:', error);
    throw error;
  }
}

module.exports = {
  getHealthReadinessByUserId,
  createHealthReadiness,
  updateHealthReadiness,
  deleteHealthReadiness,
};


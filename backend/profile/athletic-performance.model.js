const pool = require('../config/db');

/**
 * Get all athletic performance data for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of athletic performance data
 */
async function getAthleticPerformanceByUserId(userId) {
  const query = `
    SELECT 
      id,
      user_id,
      height,
      weight,
      sport,
      athlete_handedness,
      dominant_side_or_foot,
      jersey_number,
      training_hours_per_week,
      multi_sport_athlete,
      coach_verified_profile,
      hand,
      arm,
      created_at,
      updated_at
    FROM athletic_performance
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;

  try {
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching athletic performance:', error);
    throw error;
  }
}

/**
 * Create a new athletic performance entry
 * @param {string} userId - User ID
 * @param {object} data - Athletic performance data
 * @returns {Promise<object>} Created athletic performance entry
 */
async function createAthleticPerformance(userId, data) {
  const query = `
    INSERT INTO athletic_performance (
      user_id,
      height,
      weight,
      sport,
      athlete_handedness,
      dominant_side_or_foot,
      jersey_number,
      training_hours_per_week,
      multi_sport_athlete,
      coach_verified_profile,
      hand,
      arm
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `;

  const values = [
    userId,
    data.height || null,
    data.weight || null,
    data.sport || null,
    data.athleteHandedness || null,
    data.dominantSideOrFoot || null,
    data.jerseyNumber || null,
    data.trainingHoursPerWeek || null,
    data.multiSportAthlete || null,
    data.coachVerifiedProfile || null,
    data.hand || null,
    data.arm || null,
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating athletic performance:', error);
    throw error;
  }
}

/**
 * Update an athletic performance entry
 * @param {string} id - Athletic performance ID
 * @param {object} data - Athletic performance data
 * @returns {Promise<object>} Updated athletic performance entry
 */
async function updateAthleticPerformance(id, data) {
  const updateFields = [];
  const values = [];
  let paramIndex = 1;

  if (data.height !== undefined) {
    updateFields.push(`height = $${paramIndex++}`);
    values.push(data.height || null);
  }
  if (data.weight !== undefined) {
    updateFields.push(`weight = $${paramIndex++}`);
    values.push(data.weight || null);
  }
  if (data.sport !== undefined) {
    updateFields.push(`sport = $${paramIndex++}`);
    values.push(data.sport || null);
  }
  if (data.athleteHandedness !== undefined) {
    updateFields.push(`athlete_handedness = $${paramIndex++}`);
    values.push(data.athleteHandedness || null);
  }
  if (data.dominantSideOrFoot !== undefined) {
    updateFields.push(`dominant_side_or_foot = $${paramIndex++}`);
    values.push(data.dominantSideOrFoot || null);
  }
  if (data.jerseyNumber !== undefined) {
    updateFields.push(`jersey_number = $${paramIndex++}`);
    values.push(data.jerseyNumber || null);
  }
  if (data.trainingHoursPerWeek !== undefined) {
    updateFields.push(`training_hours_per_week = $${paramIndex++}`);
    values.push(data.trainingHoursPerWeek || null);
  }
  if (data.multiSportAthlete !== undefined) {
    updateFields.push(`multi_sport_athlete = $${paramIndex++}`);
    values.push(data.multiSportAthlete || null);
  }
  if (data.coachVerifiedProfile !== undefined) {
    updateFields.push(`coach_verified_profile = $${paramIndex++}`);
    values.push(data.coachVerifiedProfile || null);
  }
  if (data.hand !== undefined) {
    updateFields.push(`hand = $${paramIndex++}`);
    values.push(data.hand || null);
  }
  if (data.arm !== undefined) {
    updateFields.push(`arm = $${paramIndex++}`);
    values.push(data.arm || null);
  }

  if (updateFields.length === 0) {
    throw new Error('No fields to update');
  }

  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const query = `
    UPDATE athletic_performance
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Athletic performance entry not found');
    }
    return result.rows[0];
  } catch (error) {
    console.error('Error updating athletic performance:', error);
    throw error;
  }
}

/**
 * Delete an athletic performance entry
 * @param {string} id - Athletic performance ID
 * @returns {Promise<boolean>} True if deleted successfully
 */
async function deleteAthleticPerformance(id) {
  const query = `
    DELETE FROM athletic_performance
    WHERE id = $1
    RETURNING id
  `;

  try {
    const result = await pool.query(query, [id]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error deleting athletic performance:', error);
    throw error;
  }
}

module.exports = {
  getAthleticPerformanceByUserId,
  createAthleticPerformance,
  updateAthleticPerformance,
  deleteAthleticPerformance,
};

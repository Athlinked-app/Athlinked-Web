const pool = require('../config/db');

/**
 * Add an athlete to coach's favorites
 * @param {string} coachId - Coach user ID
 * @param {string} athleteId - Athlete user ID
 * @returns {Promise<boolean>} True if added successfully, false if already in favorites
 */
async function addFavorite(coachId, athleteId) {
  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

    if (coachId === athleteId) {
      await dbClient.query('ROLLBACK');
      throw new Error('Cannot add yourself to favorites');
    }

    // Verify coach and athlete exist and get their info
    const coachQuery = 'SELECT username, full_name, user_type, favourites FROM users WHERE id = $1';
    const athleteQuery = 'SELECT username, full_name, user_type FROM users WHERE id = $1';

    const [coachResult, athleteResult] = await Promise.all([
      dbClient.query(coachQuery, [coachId]),
      dbClient.query(athleteQuery, [athleteId]),
    ]);

    if (coachResult.rows.length === 0 || athleteResult.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      throw new Error('User not found');
    }

    // Verify coach is actually a coach
    if (coachResult.rows[0].user_type !== 'coach') {
      await dbClient.query('ROLLBACK');
      throw new Error('Only coaches can add favorites');
    }

    // Verify athlete is actually an athlete
    if (athleteResult.rows[0].user_type !== 'athlete') {
      await dbClient.query('ROLLBACK');
      throw new Error('Can only add athletes to favorites');
    }

    // Get athlete's full_name to store in favorites
    const athleteName = athleteResult.rows[0].full_name;

    // Check if already in favorites (by name)
    const currentFavorites = coachResult.rows[0].favourites || [];
    if (currentFavorites.includes(athleteName)) {
      await dbClient.query('ROLLBACK');
      return false; // Already in favorites
    }

    // Add athlete name to favorites array
    const updateQuery = `
      UPDATE users 
      SET favourites = array_append(favourites, $1)
      WHERE id = $2 AND NOT ($1 = ANY(favourites))
    `;
    const result = await dbClient.query(updateQuery, [athleteName, coachId]);

    if (result.rowCount === 0) {
      await dbClient.query('ROLLBACK');
      return false; // Already in favorites (race condition check)
    }

    await dbClient.query('COMMIT');
    return true;
  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error('Error adding favorite:', error);
    throw error;
  } finally {
    dbClient.release();
  }
}

/**
 * Remove an athlete from coach's favorites
 * @param {string} coachId - Coach user ID
 * @param {string} athleteId - Athlete user ID
 * @returns {Promise<boolean>} True if removed successfully, false if not in favorites
 */
async function removeFavorite(coachId, athleteId) {
  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

    // Get athlete's name
    const athleteQuery = 'SELECT full_name FROM users WHERE id = $1';
    const athleteResult = await dbClient.query(athleteQuery, [athleteId]);

    if (athleteResult.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      throw new Error('Athlete not found');
    }

    const athleteName = athleteResult.rows[0].full_name;

    // Check if in favorites
    const checkQuery = 'SELECT favourites FROM users WHERE id = $1';
    const checkResult = await dbClient.query(checkQuery, [coachId]);

    if (checkResult.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      throw new Error('User not found');
    }

    const currentFavorites = checkResult.rows[0].favourites || [];
    if (!currentFavorites.includes(athleteName)) {
      await dbClient.query('ROLLBACK');
      return false; // Not in favorites
    }

    // Remove athlete name from favorites array
    const updateQuery = `
      UPDATE users 
      SET favourites = array_remove(favourites, $1)
      WHERE id = $2
    `;
    const result = await dbClient.query(updateQuery, [athleteName, coachId]);

    if (result.rowCount === 0) {
      await dbClient.query('ROLLBACK');
      return false;
    }

    await dbClient.query('COMMIT');
    return true;
  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error('Error removing favorite:', error);
    throw error;
  } finally {
    dbClient.release();
  }
}

/**
 * Check if athlete is in coach's favorites
 * @param {string} coachId - Coach user ID
 * @param {string} athleteId - Athlete user ID
 * @returns {Promise<boolean>} True if in favorites
 */
async function isFavorite(coachId, athleteId) {
  // First get the athlete's name, then check if it's in coach's favourites
  const query = `
    SELECT 
      coach.id as coach_id,
      athlete.full_name as athlete_name
    FROM users coach
    CROSS JOIN users athlete
    WHERE coach.id = $1 
      AND athlete.id = $2
      AND athlete.full_name = ANY(COALESCE(coach.favourites, '{}'::text[]))
  `;

  try {
    const result = await pool.query(query, [coachId, athleteId]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking favorite status:', error);
    throw error;
  }
}

/**
 * Get all favorites for a coach
 * @param {string} coachId - Coach user ID
 * @returns {Promise<Array>} Array of favorite athlete data
 */
async function getFavorites(coachId) {
  // Get all users whose full_name is in the coach's favourites array
  // Using unnest to preserve order (most recently added first, since array_append adds to end)
  const query = `
    SELECT 
      u.id,
      u.username,
      u.full_name,
      u.user_type,
      u.profile_url,
      u.bio,
      u.primary_sport,
      u.sports_played,
      u.city,
      u.education
    FROM users coach
    CROSS JOIN LATERAL unnest(COALESCE(coach.favourites, '{}'::text[])) WITH ORDINALITY AS fav(athlete_name, position)
    INNER JOIN users u ON u.full_name = fav.athlete_name
    WHERE coach.id = $1
    ORDER BY fav.position DESC
  `;

  try {
    const result = await pool.query(query, [coachId]);
    
    // Map results and add favorited_at (we'll use current timestamp as approximation)
    // Note: Since we're using an array, we don't have individual timestamps per favorite
    return result.rows.map(row => ({
      id: row.id,
      username: row.username,
      full_name: row.full_name,
      user_type: row.user_type,
      profile_url: row.profile_url,
      bio: row.bio,
      primary_sport: row.primary_sport,
      sports_played: row.sports_played,
      city: row.city,
      education: row.education,
      favorited_at: new Date().toISOString(), // Approximation since we don't store timestamp per favorite
    }));
  } catch (error) {
    console.error('Error fetching favorites:', error);
    throw error;
  }
}

module.exports = {
  addFavorite,
  removeFavorite,
  isFavorite,
  getFavorites,
};

const pool = require('../config/db');

/**
 * Get all competition clubs for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of competition clubs
 */
async function getCompetitionClubsByUserId(userId) {
  const query = `
    SELECT 
      id,
      user_id,
      club_or_travel_team_name,
      team_level,
      league_or_organization_name,
      tournament_participation,
      created_at,
      updated_at
    FROM competition_clubs
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;

  try {
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching competition clubs:', error);
    throw error;
  }
}

/**
 * Create a new competition club entry
 * @param {string} userId - User ID
 * @param {object} data - Competition club data
 * @returns {Promise<object>} Created competition club entry
 */
async function createCompetitionClub(userId, data) {
  const query = `
    INSERT INTO competition_clubs (
      user_id,
      club_or_travel_team_name,
      team_level,
      league_or_organization_name,
      tournament_participation
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const values = [
    userId,
    data.clubOrTravelTeamName || null,
    data.teamLevel || null,
    data.leagueOrOrganizationName || null,
    data.tournamentParticipation || null,
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating competition club:', error);
    throw error;
  }
}

/**
 * Update a competition club entry
 * @param {string} id - Competition club ID
 * @param {object} data - Competition club data
 * @returns {Promise<object>} Updated competition club entry
 */
async function updateCompetitionClub(id, data) {
  const updateFields = [];
  const values = [];
  let paramIndex = 1;

  if (data.clubOrTravelTeamName !== undefined) {
    updateFields.push(`club_or_travel_team_name = $${paramIndex++}`);
    values.push(data.clubOrTravelTeamName || null);
  }
  if (data.teamLevel !== undefined) {
    updateFields.push(`team_level = $${paramIndex++}`);
    values.push(data.teamLevel || null);
  }
  if (data.leagueOrOrganizationName !== undefined) {
    updateFields.push(`league_or_organization_name = $${paramIndex++}`);
    values.push(data.leagueOrOrganizationName || null);
  }
  if (data.tournamentParticipation !== undefined) {
    updateFields.push(`tournament_participation = $${paramIndex++}`);
    values.push(data.tournamentParticipation || null);
  }

  if (updateFields.length === 0) {
    throw new Error('No fields to update');
  }

  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const query = `
    UPDATE competition_clubs
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Competition club entry not found');
    }
    return result.rows[0];
  } catch (error) {
    console.error('Error updating competition club:', error);
    throw error;
  }
}

/**
 * Delete a competition club entry
 * @param {string} id - Competition club ID
 * @returns {Promise<boolean>} True if deleted successfully
 */
async function deleteCompetitionClub(id) {
  const query = `
    DELETE FROM competition_clubs
    WHERE id = $1
    RETURNING id
  `;

  try {
    const result = await pool.query(query, [id]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error deleting competition club:', error);
    throw error;
  }
}

module.exports = {
  getCompetitionClubsByUserId,
  createCompetitionClub,
  updateCompetitionClub,
  deleteCompetitionClub,
};


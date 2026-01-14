const {
  getCompetitionClubsByUserId,
  createCompetitionClub,
  updateCompetitionClub,
  deleteCompetitionClub,
} = require('./competition-clubs.model');

/**
 * Transform database row to frontend format
 */
function transformToFrontendFormat(row) {
  return {
    id: row.id,
    clubOrTravelTeamName: row.club_or_travel_team_name,
    teamLevel: row.team_level,
    leagueOrOrganizationName: row.league_or_organization_name,
    tournamentParticipation: row.tournament_participation,
  };
}

/**
 * Get competition clubs service
 * @param {string} userId - User ID
 * @returns {Promise<object>} Competition clubs response
 */
async function getCompetitionClubsService(userId) {
  try {
    const clubs = await getCompetitionClubsByUserId(userId);
    const transformed = clubs.map(transformToFrontendFormat);
    return {
      success: true,
      data: transformed,
    };
  } catch (error) {
    console.error('Error in getCompetitionClubsService:', error);
    throw error;
  }
}

/**
 * Create competition club service
 * @param {string} userId - User ID
 * @param {object} data - Competition club data
 * @returns {Promise<object>} Created competition club response
 */
async function createCompetitionClubService(userId, data) {
  try {
    if (!data.clubOrTravelTeamName) {
      throw new Error('Club or Travel Team Name is required');
    }

    const club = await createCompetitionClub(userId, data);
    return {
      success: true,
      message: 'Competition club created successfully',
      data: transformToFrontendFormat(club),
    };
  } catch (error) {
    console.error('Error in createCompetitionClubService:', error);
    throw error;
  }
}

/**
 * Update competition club service
 * @param {string} id - Competition club ID
 * @param {object} data - Competition club data
 * @returns {Promise<object>} Updated competition club response
 */
async function updateCompetitionClubService(id, data) {
  try {
    const club = await updateCompetitionClub(id, data);
    return {
      success: true,
      message: 'Competition club updated successfully',
      data: transformToFrontendFormat(club),
    };
  } catch (error) {
    console.error('Error in updateCompetitionClubService:', error);
    throw error;
  }
}

/**
 * Delete competition club service
 * @param {string} id - Competition club ID
 * @returns {Promise<object>} Deletion response
 */
async function deleteCompetitionClubService(id) {
  try {
    const deleted = await deleteCompetitionClub(id);
    if (!deleted) {
      throw new Error('Competition club entry not found');
    }
    return {
      success: true,
      message: 'Competition club deleted successfully',
    };
  } catch (error) {
    console.error('Error in deleteCompetitionClubService:', error);
    throw error;
  }
}

module.exports = {
  getCompetitionClubsService,
  createCompetitionClubService,
  updateCompetitionClubService,
  deleteCompetitionClubService,
};

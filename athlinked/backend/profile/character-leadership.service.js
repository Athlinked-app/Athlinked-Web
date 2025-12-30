const {
  getCharacterLeadershipByUserId,
  createCharacterLeadership,
  updateCharacterLeadership,
  deleteCharacterLeadership,
} = require('./character-leadership.model');

/**
 * Transform database row to frontend format
 */
function transformToFrontendFormat(row) {
  return {
    id: row.id,
    teamCaptain: row.team_captain,
    leadershipRoles: row.leadership_roles,
    languagesSpoken: Array.isArray(row.languages_spoken) 
      ? row.languages_spoken 
      : (row.languages_spoken ? [row.languages_spoken] : []),
    communityService: row.community_service,
  };
}

/**
 * Get character and leadership service
 * @param {string} userId - User ID
 * @returns {Promise<object>} Character and leadership response
 */
async function getCharacterLeadershipService(userId) {
  try {
    const leadership = await getCharacterLeadershipByUserId(userId);
    const transformed = leadership.map(transformToFrontendFormat);
    return {
      success: true,
      data: transformed,
    };
  } catch (error) {
    console.error('Error in getCharacterLeadershipService:', error);
    throw error;
  }
}

/**
 * Create character and leadership service
 * @param {string} userId - User ID
 * @param {object} data - Character and leadership data
 * @returns {Promise<object>} Created character and leadership response
 */
async function createCharacterLeadershipService(userId, data) {
  try {
    const leadership = await createCharacterLeadership(userId, data);
    return {
      success: true,
      message: 'Character and leadership data created successfully',
      data: transformToFrontendFormat(leadership),
    };
  } catch (error) {
    console.error('Error in createCharacterLeadershipService:', error);
    throw error;
  }
}

/**
 * Update character and leadership service
 * @param {string} id - Character and leadership ID
 * @param {object} data - Character and leadership data
 * @returns {Promise<object>} Updated character and leadership response
 */
async function updateCharacterLeadershipService(id, data) {
  try {
    const leadership = await updateCharacterLeadership(id, data);
    return {
      success: true,
      message: 'Character and leadership data updated successfully',
      data: transformToFrontendFormat(leadership),
    };
  } catch (error) {
    console.error('Error in updateCharacterLeadershipService:', error);
    throw error;
  }
}

/**
 * Delete character and leadership service
 * @param {string} id - Character and leadership ID
 * @returns {Promise<object>} Deletion response
 */
async function deleteCharacterLeadershipService(id) {
  try {
    const deleted = await deleteCharacterLeadership(id);
    if (!deleted) {
      throw new Error('Character and leadership entry not found');
    }
    return {
      success: true,
      message: 'Character and leadership data deleted successfully',
    };
  } catch (error) {
    console.error('Error in deleteCharacterLeadershipService:', error);
    throw error;
  }
}

module.exports = {
  getCharacterLeadershipService,
  createCharacterLeadershipService,
  updateCharacterLeadershipService,
  deleteCharacterLeadershipService,
};


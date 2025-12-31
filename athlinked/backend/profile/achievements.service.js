const {
  getAchievementsByUserId,
  createAchievement,
  updateAchievement,
  deleteAchievement,
} = require('./achievements.model');

/**
 * Transform database row to frontend format
 */
function transformToFrontendFormat(row) {
  return {
    id: row.id,
    title: row.title,
    organization: row.organization,
    dateAwarded: row.date_awarded,
    sport: row.sport,
    positionEvent: row.position_event,
    achievementType: row.achievement_type,
    level: row.level,
    location: row.location,
    description: row.description,
    mediaPdf: row.media_pdf,
  };
}

/**
 * Get achievements service
 * @param {string} userId - User ID
 * @returns {Promise<object>} Achievements response
 */
async function getAchievementsService(userId) {
  try {
    const achievements = await getAchievementsByUserId(userId);
    const transformed = achievements.map(transformToFrontendFormat);
    return {
      success: true,
      data: transformed,
    };
  } catch (error) {
    console.error('Error in getAchievementsService:', error);
    throw error;
  }
}

/**
 * Create achievement service
 * @param {string} userId - User ID
 * @param {object} data - Achievement data
 * @returns {Promise<object>} Created achievement response
 */
async function createAchievementService(userId, data) {
  try {
    if (!data.title) {
      throw new Error('Title is required');
    }

    const achievement = await createAchievement(userId, data);
    return {
      success: true,
      message: 'Achievement created successfully',
      data: transformToFrontendFormat(achievement),
    };
  } catch (error) {
    console.error('Error in createAchievementService:', error);
    throw error;
  }
}

/**
 * Update achievement service
 * @param {string} id - Achievement ID
 * @param {object} data - Achievement data
 * @returns {Promise<object>} Updated achievement response
 */
async function updateAchievementService(id, data) {
  try {
    const achievement = await updateAchievement(id, data);
    return {
      success: true,
      message: 'Achievement updated successfully',
      data: transformToFrontendFormat(achievement),
    };
  } catch (error) {
    console.error('Error in updateAchievementService:', error);
    throw error;
  }
}

/**
 * Delete achievement service
 * @param {string} id - Achievement ID
 * @returns {Promise<object>} Deletion response
 */
async function deleteAchievementService(id) {
  try {
    const deleted = await deleteAchievement(id);
    if (!deleted) {
      throw new Error('Achievement not found');
    }
    return {
      success: true,
      message: 'Achievement deleted successfully',
    };
  } catch (error) {
    console.error('Error in deleteAchievementService:', error);
    throw error;
  }
}

module.exports = {
  getAchievementsService,
  createAchievementService,
  updateAchievementService,
  deleteAchievementService,
};

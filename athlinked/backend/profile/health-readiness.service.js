const {
  getHealthReadinessByUserId,
  createHealthReadiness,
  updateHealthReadiness,
  deleteHealthReadiness,
} = require('./health-readiness.model');

/**
 * Transform database row to frontend format
 */
function transformToFrontendFormat(row) {
  return {
    id: row.id,
    injuryHistory: row.injury_history,
    restingHeartRate: row.resting_heart_rate,
    enduranceMetric: row.endurance_metric,
  };
}

/**
 * Get health and readiness service
 * @param {string} userId - User ID
 * @returns {Promise<object>} Health and readiness response
 */
async function getHealthReadinessService(userId) {
  try {
    const readiness = await getHealthReadinessByUserId(userId);
    const transformed = readiness.map(transformToFrontendFormat);
    return {
      success: true,
      data: transformed,
    };
  } catch (error) {
    console.error('Error in getHealthReadinessService:', error);
    throw error;
  }
}

/**
 * Create health and readiness service
 * @param {string} userId - User ID
 * @param {object} data - Health and readiness data
 * @returns {Promise<object>} Created health and readiness response
 */
async function createHealthReadinessService(userId, data) {
  try {
    const readiness = await createHealthReadiness(userId, data);
    return {
      success: true,
      message: 'Health and readiness data created successfully',
      data: transformToFrontendFormat(readiness),
    };
  } catch (error) {
    console.error('Error in createHealthReadinessService:', error);
    throw error;
  }
}

/**
 * Update health and readiness service
 * @param {string} id - Health and readiness ID
 * @param {object} data - Health and readiness data
 * @returns {Promise<object>} Updated health and readiness response
 */
async function updateHealthReadinessService(id, data) {
  try {
    const readiness = await updateHealthReadiness(id, data);
    return {
      success: true,
      message: 'Health and readiness data updated successfully',
      data: transformToFrontendFormat(readiness),
    };
  } catch (error) {
    console.error('Error in updateHealthReadinessService:', error);
    throw error;
  }
}

/**
 * Delete health and readiness service
 * @param {string} id - Health and readiness ID
 * @returns {Promise<object>} Deletion response
 */
async function deleteHealthReadinessService(id) {
  try {
    const deleted = await deleteHealthReadiness(id);
    if (!deleted) {
      throw new Error('Health and readiness entry not found');
    }
    return {
      success: true,
      message: 'Health and readiness data deleted successfully',
    };
  } catch (error) {
    console.error('Error in deleteHealthReadinessService:', error);
    throw error;
  }
}

module.exports = {
  getHealthReadinessService,
  createHealthReadinessService,
  updateHealthReadinessService,
  deleteHealthReadinessService,
};


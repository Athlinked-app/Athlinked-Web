const {
  getAthleticPerformanceByUserId,
  createAthleticPerformance,
  updateAthleticPerformance,
  deleteAthleticPerformance,
} = require('./athletic-performance.model');

/**
 * Transform database row to frontend format
 */
function transformToFrontendFormat(row) {
  return {
    id: row.id,
    height: row.height,
    weight: row.weight,
    sport: row.sport,
    athleteHandedness: row.athlete_handedness,
    dominantSideOrFoot: row.dominant_side_or_foot,
    jerseyNumber: row.jersey_number,
    trainingHoursPerWeek: row.training_hours_per_week,
    multiSportAthlete: row.multi_sport_athlete,
    coachVerifiedProfile: row.coach_verified_profile,
    hand: row.hand,
    arm: row.arm,
  };
}

/**
 * Get athletic performance service
 * @param {string} userId - User ID
 * @returns {Promise<object>} Athletic performance response
 */
async function getAthleticPerformanceService(userId) {
  try {
    const performance = await getAthleticPerformanceByUserId(userId);
    const transformed = performance.map(transformToFrontendFormat);
    return {
      success: true,
      data: transformed,
    };
  } catch (error) {
    console.error('Error in getAthleticPerformanceService:', error);
    throw error;
  }
}

/**
 * Create athletic performance service
 * @param {string} userId - User ID
 * @param {object} data - Athletic performance data
 * @returns {Promise<object>} Created athletic performance response
 */
async function createAthleticPerformanceService(userId, data) {
  try {
    const performance = await createAthleticPerformance(userId, data);
    return {
      success: true,
      message: 'Athletic performance data created successfully',
      data: transformToFrontendFormat(performance),
    };
  } catch (error) {
    console.error('Error in createAthleticPerformanceService:', error);
    throw error;
  }
}

/**
 * Update athletic performance service
 * @param {string} id - Athletic performance ID
 * @param {object} data - Athletic performance data
 * @returns {Promise<object>} Updated athletic performance response
 */
async function updateAthleticPerformanceService(id, data) {
  try {
    const performance = await updateAthleticPerformance(id, data);
    return {
      success: true,
      message: 'Athletic performance data updated successfully',
      data: transformToFrontendFormat(performance),
    };
  } catch (error) {
    console.error('Error in updateAthleticPerformanceService:', error);
    throw error;
  }
}

/**
 * Delete athletic performance service
 * @param {string} id - Athletic performance ID
 * @returns {Promise<object>} Deletion response
 */
async function deleteAthleticPerformanceService(id) {
  try {
    const deleted = await deleteAthleticPerformance(id);
    if (!deleted) {
      throw new Error('Athletic performance entry not found');
    }
    return {
      success: true,
      message: 'Athletic performance data deleted successfully',
    };
  } catch (error) {
    console.error('Error in deleteAthleticPerformanceService:', error);
    throw error;
  }
}

module.exports = {
  getAthleticPerformanceService,
  createAthleticPerformanceService,
  updateAthleticPerformanceService,
  deleteAthleticPerformanceService,
};

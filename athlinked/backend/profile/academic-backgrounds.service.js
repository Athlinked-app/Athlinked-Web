const {
  getAcademicBackgroundsByUserId,
  createAcademicBackground,
  updateAcademicBackground,
  deleteAcademicBackground,
} = require('./academic-backgrounds.model');

/**
 * Transform database row to frontend format
 */
function transformToFrontendFormat(row) {
  return {
    id: row.id,
    school: row.school,
    degree: row.degree,
    qualification: row.qualification,
    startDate: row.start_date,
    endDate: row.end_date,
    degreePdf: row.degree_pdf,
    academicGpa: row.academic_gpa,
    satActScore: row.sat_act_score,
    academicHonors: row.academic_honors,
    collegeEligibilityStatus: row.college_eligibility_status,
    graduationYear: row.graduation_year,
    primaryStateRegion: row.primary_state_region,
    preferredCollegeRegions: row.preferred_college_regions,
    willingnessToRelocate: row.willingness_to_relocate,
    gender: row.gender,
  };
}

/**
 * Get academic backgrounds service
 * @param {string} userId - User ID
 * @returns {Promise<object>} Academic backgrounds response
 */
async function getAcademicBackgroundsService(userId) {
  try {
    const backgrounds = await getAcademicBackgroundsByUserId(userId);
    const transformed = backgrounds.map(transformToFrontendFormat);
    return {
      success: true,
      data: transformed,
    };
  } catch (error) {
    console.error('Error in getAcademicBackgroundsService:', error);
    throw error;
  }
}

/**
 * Create academic background service
 * @param {string} userId - User ID
 * @param {object} data - Academic background data
 * @returns {Promise<object>} Created academic background response
 */
async function createAcademicBackgroundService(userId, data) {
  try {
    if (!data.school) {
      throw new Error('School is required');
    }

    const background = await createAcademicBackground(userId, data);
    return {
      success: true,
      message: 'Academic background created successfully',
      data: transformToFrontendFormat(background),
    };
  } catch (error) {
    console.error('Error in createAcademicBackgroundService:', error);
    throw error;
  }
}

/**
 * Update academic background service
 * @param {string} id - Academic background ID
 * @param {object} data - Academic background data
 * @returns {Promise<object>} Updated academic background response
 */
async function updateAcademicBackgroundService(id, data) {
  try {
    const background = await updateAcademicBackground(id, data);
    return {
      success: true,
      message: 'Academic background updated successfully',
      data: transformToFrontendFormat(background),
    };
  } catch (error) {
    console.error('Error in updateAcademicBackgroundService:', error);
    throw error;
  }
}

/**
 * Delete academic background service
 * @param {string} id - Academic background ID
 * @returns {Promise<object>} Deletion response
 */
async function deleteAcademicBackgroundService(id) {
  try {
    const deleted = await deleteAcademicBackground(id);
    if (!deleted) {
      throw new Error('Academic background not found');
    }
    return {
      success: true,
      message: 'Academic background deleted successfully',
    };
  } catch (error) {
    console.error('Error in deleteAcademicBackgroundService:', error);
    throw error;
  }
}

module.exports = {
  getAcademicBackgroundsService,
  createAcademicBackgroundService,
  updateAcademicBackgroundService,
  deleteAcademicBackgroundService,
};


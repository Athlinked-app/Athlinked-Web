const {
  getAcademicBackgroundsByUserId,
  createAcademicBackground,
  updateAcademicBackground,
  getAcademicBackgroundById,
  deleteAcademicBackground,
} = require('./academic-backgrounds.model');
const { convertKeyToPresignedUrl } = require('../utils/s3');

/**
 * Transform database row to frontend format
 * Converts S3 keys to presigned URLs for PDFs when fetching
 */
async function transformToFrontendFormat(row) {
  // Convert S3 key to presigned URL for PDF (if it exists)
  const degreePdf = row.degree_pdf 
    ? await convertKeyToPresignedUrl(row.degree_pdf)
    : null;

  return {
    id: row.id,
    school: row.school,
    degree: row.degree,
    qualification: row.qualification,
    startDate: row.start_date,
    endDate: row.end_date,
    degreePdf: degreePdf,
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
    // Convert S3 keys to presigned URLs for PDFs
    const transformed = await Promise.all(
      backgrounds.map(row => transformToFrontendFormat(row))
    );
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
    // Convert S3 key to presigned URL for PDF when returning
    const transformed = await transformToFrontendFormat(background);
    return {
      success: true,
      message: 'Academic background created successfully',
      data: transformed,
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
    // Get current academic background to get old PDF URL before updating
    const currentBackground = await getAcademicBackgroundById(id);
    const oldDegreePdf = currentBackground?.degree_pdf;

    const background = await updateAcademicBackground(id, data);

    // Delete old PDF from S3 if it exists and is being replaced
    if (data.degreePdf !== undefined && oldDegreePdf && oldDegreePdf !== data.degreePdf) {
      try {
        const { deleteFromS3 } = require('../utils/s3');
        await deleteFromS3(oldDegreePdf);
        console.log('Deleted old academic background PDF from S3:', oldDegreePdf);
      } catch (s3Error) {
        // Log error but continue
        console.error('Error deleting old academic background PDF from S3:', s3Error.message);
      }
    }

    // Convert S3 key to presigned URL for PDF when returning
    const transformed = await transformToFrontendFormat(background);
    return {
      success: true,
      message: 'Academic background updated successfully',
      data: transformed,
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
    // Get the academic background first to get the PDF URL
    const background = await getAcademicBackgroundById(id);
    if (!background) {
      throw new Error('Academic background not found');
    }

    // Delete PDF file from S3 if it exists
    if (background.degree_pdf) {
      try {
        const { deleteFromS3 } = require('../utils/s3');
        await deleteFromS3(background.degree_pdf);
        console.log('Deleted academic background PDF from S3:', background.degree_pdf);
      } catch (s3Error) {
        // Log error but continue with database deletion
        console.error('Error deleting academic background PDF from S3:', s3Error.message);
      }
    }

    // Delete from database
    const deleted = await deleteAcademicBackground(id);
    if (!deleted) {
      throw new Error('Failed to delete academic background');
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

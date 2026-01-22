const {
  getAchievementsByUserId,
  createAchievement,
  updateAchievement,
  getAchievementById,
  deleteAchievement,
} = require('./achievements.model');
const { convertKeyToPresignedUrl } = require('../utils/s3');

/**
 * Transform database row to frontend format
 * Converts S3 keys to presigned URLs for PDFs when fetching
 */
async function transformToFrontendFormat(row) {
  // Convert S3 key to presigned URL for PDF (if it exists)
  const mediaPdf = row.media_pdf 
    ? await convertKeyToPresignedUrl(row.media_pdf)
    : null;

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
    mediaPdf: mediaPdf,
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
    // Convert S3 keys to presigned URLs for PDFs
    const transformed = await Promise.all(
      achievements.map(row => transformToFrontendFormat(row))
    );
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
    // Convert S3 key to presigned URL for PDF when returning
    const transformed = await transformToFrontendFormat(achievement);
    return {
      success: true,
      message: 'Achievement created successfully',
      data: transformed,
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
    // Get current achievement to get old PDF URL before updating
    const currentAchievement = await getAchievementById(id);
    const oldMediaPdf = currentAchievement?.media_pdf;

    const achievement = await updateAchievement(id, data);

    // Delete old PDF from S3 if it exists and is being replaced
    if (data.mediaPdf !== undefined && oldMediaPdf && oldMediaPdf !== data.mediaPdf) {
      try {
        const { deleteFromS3 } = require('../utils/s3');
        await deleteFromS3(oldMediaPdf);
        console.log('Deleted old achievement PDF from S3:', oldMediaPdf);
      } catch (s3Error) {
        // Log error but continue
        console.error('Error deleting old achievement PDF from S3:', s3Error.message);
      }
    }

    // Convert S3 key to presigned URL for PDF when returning
    const transformed = await transformToFrontendFormat(achievement);
    return {
      success: true,
      message: 'Achievement updated successfully',
      data: transformed,
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
    // Get the achievement first to get the PDF URL
    const achievement = await getAchievementById(id);
    if (!achievement) {
      throw new Error('Achievement not found');
    }

    // Delete PDF file from S3 if it exists
    if (achievement.media_pdf) {
      try {
        const { deleteFromS3 } = require('../utils/s3');
        await deleteFromS3(achievement.media_pdf);
        console.log('Deleted achievement PDF from S3:', achievement.media_pdf);
      } catch (s3Error) {
        // Log error but continue with database deletion
        console.error('Error deleting achievement PDF from S3:', s3Error.message);
      }
    }

    // Delete from database
    const deleted = await deleteAchievement(id);
    if (!deleted) {
      throw new Error('Failed to delete achievement');
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

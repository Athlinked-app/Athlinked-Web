const {
  getVideoMediaByUserId,
  createVideoMedia,
  updateVideoMedia,
  deleteVideoMedia,
} = require('./video-media.model');

/**
 * Transform database row to frontend format
 */
function transformToFrontendFormat(row) {
  return {
    id: row.id,
    highlightVideoLink: row.highlight_video_link,
    videoStatus: row.video_status,
    verifiedMediaProfile: row.verified_media_profile,
  };
}

/**
 * Get video and media service
 * @param {string} userId - User ID
 * @returns {Promise<object>} Video and media response
 */
async function getVideoMediaService(userId) {
  try {
    const media = await getVideoMediaByUserId(userId);
    const transformed = media.map(transformToFrontendFormat);
    return {
      success: true,
      data: transformed,
    };
  } catch (error) {
    console.error('Error in getVideoMediaService:', error);
    throw error;
  }
}

/**
 * Create video and media service
 * @param {string} userId - User ID
 * @param {object} data - Video and media data
 * @returns {Promise<object>} Created video and media response
 */
async function createVideoMediaService(userId, data) {
  try {
    const media = await createVideoMedia(userId, data);
    return {
      success: true,
      message: 'Video and media data created successfully',
      data: transformToFrontendFormat(media),
    };
  } catch (error) {
    console.error('Error in createVideoMediaService:', error);
    throw error;
  }
}

/**
 * Update video and media service
 * @param {string} id - Video and media ID
 * @param {object} data - Video and media data
 * @returns {Promise<object>} Updated video and media response
 */
async function updateVideoMediaService(id, data) {
  try {
    const media = await updateVideoMedia(id, data);
    return {
      success: true,
      message: 'Video and media data updated successfully',
      data: transformToFrontendFormat(media),
    };
  } catch (error) {
    console.error('Error in updateVideoMediaService:', error);
    throw error;
  }
}

/**
 * Delete video and media service
 * @param {string} id - Video and media ID
 * @returns {Promise<object>} Deletion response
 */
async function deleteVideoMediaService(id) {
  try {
    const deleted = await deleteVideoMedia(id);
    if (!deleted) {
      throw new Error('Video and media entry not found');
    }
    return {
      success: true,
      message: 'Video and media data deleted successfully',
    };
  } catch (error) {
    console.error('Error in deleteVideoMediaService:', error);
    throw error;
  }
}

module.exports = {
  getVideoMediaService,
  createVideoMediaService,
  updateVideoMediaService,
  deleteVideoMediaService,
};

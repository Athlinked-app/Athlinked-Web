const videosModel = require('./videos.model');

/**
 * Create a new video
 * @param {object} videoData - Video data object
 * @returns {Promise<object>} Service result with created video
 */
async function createVideoService(videoData) {
  try {
    const { user_id, title, description, video_url, video_duration } =
      videoData;

    if (!video_url) {
      throw new Error('video_url is required');
    }

    const video = await videosModel.createVideo({
      user_id,
      title,
      description,
      video_url,
      video_duration: video_duration ? parseInt(video_duration) : null,
    });

    return {
      success: true,
      video,
    };
  } catch (error) {
    console.error('Create video service error:', error.message);
    throw error;
  }
}

/**
 * Get all active videos
 * @returns {Promise<object>} Service result with videos array
 */
async function getAllVideosService() {
  try {
    const videos = await videosModel.getAllVideos();
    return {
      success: true,
      videos,
    };
  } catch (error) {
    console.error('Get all videos service error:', error.message);
    throw error;
  }
}

/**
 * Delete a video (hard delete)
 * @param {string} videoId - Video ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<object>} Service result
 */
async function deleteVideoService(videoId, userId) {
  try {
    const video = await videosModel.getVideoById(videoId);
    if (!video) {
      throw new Error('Video not found');
    }

    if (video.user_id !== userId) {
      throw new Error('Unauthorized: You can only delete your own videos');
    }

    const deleted = await videosModel.deleteVideo(videoId, userId);
    if (!deleted) {
      throw new Error('Failed to delete video');
    }

    return {
      success: true,
      message: 'Video deleted successfully',
    };
  } catch (error) {
    console.error('Delete video service error:', error);
    throw error;
  }
}

/**
 * Soft delete a video
 * @param {string} videoId - Video ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<object>} Service result
 * @deprecated Use deleteVideoService instead for hard delete
 */
async function softDeleteVideoService(videoId, userId) {
  try {
    if (!videoId) {
      throw new Error('Video ID is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    const video = await videosModel.softDeleteVideo(videoId, userId);

    if (!video) {
      throw new Error(
        'Video not found or you do not have permission to delete it'
      );
    }

    return {
      success: true,
      message: 'Video deleted successfully',
    };
  } catch (error) {
    console.error('Soft delete video service error:', error.message);
    throw error;
  }
}

module.exports = {
  createVideoService,
  getAllVideosService,
  deleteVideoService,
  softDeleteVideoService,
};

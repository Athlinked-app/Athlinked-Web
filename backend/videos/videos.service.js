const videosModel = require('./videos.model');
const { convertKeyToPresignedUrl } = require('../utils/s3');

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
 * @param {string} userId - Optional user ID to filter by
 * @returns {Promise<object>} Service result with videos array
 */
async function getAllVideosService(userId = null) {
  try {
    const videos = await videosModel.getAllVideos(userId);

    // Convert video_url S3 keys to presigned URLs
    const videosWithPresignedUrls = await Promise.all(
      videos.map(async (video) => {
        if (video.video_url) {
          video.video_url = await convertKeyToPresignedUrl(video.video_url);
        }
        return video;
      })
    );

    return {
      success: true,
      videos: videosWithPresignedUrls,
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

    let canDelete = false;

    // Check if user is the video owner
    if (video.user_id === userId) {
      canDelete = true;
    } else {
      // Check if user is a parent of the video author
      const signupModel = require('../signup/signup.model');
      const currentUser = await signupModel.findById(userId);
      
      if (!currentUser) {
        throw new Error('User not found');
      }

      // If current user is a parent, check if video author is their child
      if (currentUser.user_type === 'parent' && currentUser.email) {
        const videoAuthor = await signupModel.findById(video.user_id);
        
        if (videoAuthor && videoAuthor.parent_email && 
            videoAuthor.parent_email.toLowerCase().trim() === currentUser.email.toLowerCase().trim()) {
          canDelete = true;
        }
      }
    }

    if (!canDelete) {
      // User is neither the video owner nor the parent of the video author
      throw new Error('Unauthorized: You can only delete your own videos or videos from your athletes');
    }

    // Delete video file from S3 if it exists
    if (video.video_url) {
      try {
        const { deleteFromS3 } = require('../utils/s3');
        await deleteFromS3(video.video_url);
        console.log('Deleted video file from S3:', video.video_url);
      } catch (s3Error) {
        // Log error but continue with database deletion
        console.error('Error deleting video file from S3:', s3Error.message);
      }
    }

    // Delete from database
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

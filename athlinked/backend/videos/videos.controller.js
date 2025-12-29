const videosService = require('./videos.service');
const upload = require('../utils/upload-resources');

async function createVideo(req, res) {
  try {
    const userId = req.body.user_id || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const {
      title,
      description,
      video_url,
      video_duration,
    } = req.body;

    let finalVideoUrl = video_url;

    if (req.file) {
      const uploadedFileUrl = `/uploads/${req.file.filename}`;
      finalVideoUrl = uploadedFileUrl;
    }

    if (!finalVideoUrl) {
      return res.status(400).json({
        success: false,
        message: 'video_url is required',
      });
    }

    const result = await videosService.createVideoService({
      user_id: userId,
      title,
      description,
      video_url: finalVideoUrl,
      video_duration: video_duration ? parseInt(video_duration) : null,
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error('Create video error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create video',
    });
  }
}

async function getAllVideos(req, res) {
  try {
    const userId = req.query.user_id || req.user?.id || null;
    const result = await videosService.getAllVideosService(userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get videos error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch videos',
    });
  }
}

/**
 * Controller to soft delete a video
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function deleteVideo(req, res) {
  try {
    // Try to get user_id from body first, then from query, then from req.user
    const userId = req.body?.user_id || req.query?.user_id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Video ID is required',
      });
    }

    const result = await videosService.deleteVideoService(id, userId);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Delete video controller error:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

module.exports = {
  createVideo,
  getAllVideos,
  deleteVideo,
};


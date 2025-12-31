const {
  getVideoMediaService,
  createVideoMediaService,
  updateVideoMediaService,
  deleteVideoMediaService,
} = require('./video-media.service');

/**
 * Get video and media for a user
 * GET /api/profile/:userId/video-media
 */
async function getVideoMediaController(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const result = await getVideoMediaService(userId);
    res.json(result);
  } catch (error) {
    console.error('Error in getVideoMediaController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch video and media data',
      error: error.message,
    });
  }
}

/**
 * Create a new video and media entry
 * POST /api/profile/:userId/video-media
 */
async function createVideoMediaController(req, res) {
  try {
    const { userId } = req.params;
    const data = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const result = await createVideoMediaService(userId, data);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error in createVideoMediaController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create video and media data',
      error: error.message,
    });
  }
}

/**
 * Update a video and media entry
 * PUT /api/profile/video-media/:id
 */
async function updateVideoMediaController(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Video and media ID is required',
      });
    }

    const result = await updateVideoMediaService(id, data);
    res.json(result);
  } catch (error) {
    console.error('Error in updateVideoMediaController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update video and media data',
      error: error.message,
    });
  }
}

/**
 * Delete a video and media entry
 * DELETE /api/profile/video-media/:id
 */
async function deleteVideoMediaController(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Video and media ID is required',
      });
    }

    const result = await deleteVideoMediaService(id);
    res.json(result);
  } catch (error) {
    console.error('Error in deleteVideoMediaController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete video and media data',
      error: error.message,
    });
  }
}

module.exports = {
  getVideoMediaController,
  createVideoMediaController,
  updateVideoMediaController,
  deleteVideoMediaController,
};


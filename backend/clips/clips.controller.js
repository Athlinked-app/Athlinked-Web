const clipsService = require('./clips.service');

/**
 * Controller to handle create clip request
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function createClip(req, res) {
  try {
    const { description } = req.body;
    const user_id = req.user?.id; // Get from auth middleware
    const file = req.file; // File from multer

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!file) {
      // Check if it's a multer error
      if (req.fileValidationError) {
        return res.status(400).json({
          success: false,
          message: req.fileValidationError,
        });
      }
      if (req.fileSizeError) {
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum size is 50MB',
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Video file is required',
      });
    }

    // Use S3 URL if available, otherwise fallback to local path (for backward compatibility)
    const video_url = file.location || `/uploads/${file.filename}`;

    const result = await clipsService.createClipService({
      user_id,
      video_url,
      description,
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error('Create clip error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

/**
 * Controller to handle get clips feed request
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getClipsFeed(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const viewerUserId = req.user?.id || null; // Get from auth middleware (optional)

    const result = await clipsService.getClipsFeedService(page, limit, viewerUserId);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Get clips feed error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/**
 * Controller to handle add comment request
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function addComment(req, res) {
  try {
    const { clipId } = req.params;
    const { comment } = req.body;
    const user_id = req.user?.id; // Get from auth middleware

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!comment) {
      return res.status(400).json({
        success: false,
        message: 'Comment is required',
      });
    }

    const result = await clipsService.addCommentService(clipId, {
      user_id,
      comment,
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error('Add comment error:', error);

    if (error.message === 'Clip not found') {
      return res.status(404).json({
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

/**
 * Controller to handle reply to comment request
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function replyToComment(req, res) {
  try {
    const { commentId } = req.params;
    const { comment } = req.body;
    const user_id = req.user?.id; // Get from auth middleware

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!comment) {
      return res.status(400).json({
        success: false,
        message: 'Comment is required',
      });
    }

    const result = await clipsService.replyToCommentService(commentId, {
      user_id,
      comment,
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error('Reply to comment error:', error);

    if (error.message === 'Parent comment not found') {
      return res.status(404).json({
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

/**
 * Controller to handle get clip comments request
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getClipComments(req, res) {
  try {
    const { clipId } = req.params;

    const result = await clipsService.getClipCommentsService(clipId);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Get clip comments error:', error);

    if (error.message === 'Clip not found') {
      return res.status(404).json({
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

/**
 * Controller to handle delete clip request
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function deleteClip(req, res) {
  try {
    const clipId = req.params.clipId;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const result = await clipsService.deleteClipService(clipId, userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Delete clip controller error:', error);
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

/**
 * Controller to handle save clip request
 */
async function saveClip(req, res) {
  try {
    const { clipId } = req.params;
    const user_id = req.body.user_id || req.user?.id;

    if (!user_id) {
      return res
        .status(401)
        .json({ success: false, message: 'Authentication required' });
    }

    if (!clipId) {
      return res.status(400).json({
        success: false,
        message: 'Clip ID is required',
      });
    }

    const result = await clipsService.saveClipService(clipId, user_id);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Save clip error:', error);
    console.error('Error stack:', error.stack);
    if (error.message === 'Clip not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message.includes('already saved')) {
      return res.status(400).json({
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

/**
 * Controller to handle unsave clip request
 */
async function unsaveClip(req, res) {
  try {
    const { clipId } = req.params;
    const user_id = req.user?.id;

    if (!user_id) {
      return res
        .status(401)
        .json({ success: false, message: 'Authentication required' });
    }

    const result = await clipsService.unsaveClipService(clipId, user_id);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Unsave clip error:', error);
    if (error.message === 'Clip not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/**
 * Controller to handle check clip save status request
 */
async function checkClipSaveStatus(req, res) {
  try {
    const { clipId } = req.params;
    const user_id = req.query.user_id || req.user?.id;

    if (!user_id) {
      return res
        .status(401)
        .json({ success: false, message: 'Authentication required' });
    }

    const isSaved = await clipsModel.checkClipSaveStatus(clipId, user_id);
    return res.status(200).json({
      success: true,
      isSaved: isSaved,
    });
  } catch (error) {
    console.error('Check clip save status error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/**
 * Controller to handle get saved clips request
 */
async function getSavedClips(req, res) {
  try {
    const userId = req.params.userId || req.user?.id;
    const limit = parseInt(req.query.limit, 10) || 50;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const result = await clipsService.getSavedClipsService(userId, limit);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get saved clips error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

module.exports = {
  createClip,
  getClipsFeed,
  addComment,
  replyToComment,
  getClipComments,
  deleteClip,
  likeClip,
  unlikeClip,
  checkClipSaveStatus,
  saveClip,
  unsaveClip,
  getSavedClips,
};

/**
 * Controller to handle like clip request
 */
async function likeClip(req, res) {
  try {
    const { clipId } = req.params;
    const user_id = req.user?.id;

    if (!user_id) {
      return res
        .status(401)
        .json({ success: false, message: 'Authentication required' });
    }

    const result = await clipsService.likeClipService(clipId, user_id);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Like clip error:', error);
    if (error.message === 'Clip not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/**
 * Controller to handle unlike clip request
 */
async function unlikeClip(req, res) {
  try {
    const { clipId } = req.params;
    const user_id = req.user?.id;

    if (!user_id) {
      return res
        .status(401)
        .json({ success: false, message: 'Authentication required' });
    }

    const result = await clipsService.unlikeClipService(clipId, user_id);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Unlike clip error:', error);
    if (error.message === 'Clip not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

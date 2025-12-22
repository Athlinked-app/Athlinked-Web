const clipsService = require('./clips.service');

/**
 * Controller to handle create clip request
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function createClip(req, res) {
  try {
    const { description } = req.body;
    const user_id = req.user?.id || req.body.user_id; // Get from auth middleware or body
    const file = req.file; // File from multer

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Video file is required',
      });
    }

    // Create URL for the uploaded file
    const video_url = `/uploads/${file.filename}`;
    // In production, this would be: `https://your-domain.com/uploads/${file.filename}`

    const result = await clipsService.createClipService({
      user_id,
      video_url,
      description,
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error('Create clip error:', error);

    if (error.message === 'User not found') {
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
 * Controller to handle get clips feed request
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getClipsFeed(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const result = await clipsService.getClipsFeedService(page, limit);

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
    const user_id = req.user?.id || req.body.user_id; // Get from auth middleware or body

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
    const user_id = req.user?.id || req.body.user_id; // Get from auth middleware or body

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

module.exports = {
  createClip,
  getClipsFeed,
  addComment,
  replyToComment,
  getClipComments,
};

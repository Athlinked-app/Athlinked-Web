const savesService = require('./saves.service');

/**
 * Unified save endpoint - saves posts or clips
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function saveItem(req, res) {
  try {
    const { type, id } = req.body;
    const userId = req.body.user_id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    if (!type || !id) {
      return res.status(400).json({
        success: false,
        message: 'Type and ID are required. Type should be "post" or "clip"',
      });
    }

    if (type !== 'post' && type !== 'clip') {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "post" or "clip"',
      });
    }

    const result = await savesService.saveItemService(type, id, userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Save item controller error:', error);
    console.error('Error stack:', error.stack);
    
    if (error.message.includes('already saved')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    
    if (error.message.includes('not found')) {
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
 * Unified unsave endpoint - unsaves posts or clips
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function unsaveItem(req, res) {
  try {
    const { type, id } = req.body;
    const userId = req.body.user_id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    if (!type || !id) {
      return res.status(400).json({
        success: false,
        message: 'Type and ID are required. Type should be "post" or "clip"',
      });
    }

    if (type !== 'post' && type !== 'clip') {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "post" or "clip"',
      });
    }

    const result = await savesService.unsaveItemService(type, id, userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Unsave item controller error:', error);
    console.error('Error stack:', error.stack);
    
    if (error.message.includes('not found')) {
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
 * Get all saved items (posts and clips) for a user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getSavedItems(req, res) {
  try {
    const userId = req.params.userId || req.user?.id;
    const limit = parseInt(req.query.limit, 10) || 50;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const result = await savesService.getSavedItemsService(userId, limit);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get saved items error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

module.exports = {
  saveItem,
  unsaveItem,
  getSavedItems,
};

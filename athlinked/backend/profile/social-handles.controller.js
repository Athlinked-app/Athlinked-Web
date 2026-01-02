const {
  getSocialHandlesService,
  createSocialHandleService,
  updateSocialHandleService,
  deleteSocialHandleService,
} = require('./social-handles.service');

/**
 * Get social handles for a user
 * GET /api/profile/:userId/social-handles
 */
async function getSocialHandlesController(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const result = await getSocialHandlesService(userId);
    res.json(result);
  } catch (error) {
    console.error('Error in getSocialHandlesController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch social handles',
      error: error.message,
    });
  }
}

/**
 * Create a new social handle
 * POST /api/profile/:userId/social-handles
 */
async function createSocialHandleController(req, res) {
  try {
    const { userId } = req.params;
    const { platform, url } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    if (!platform || !url) {
      return res.status(400).json({
        success: false,
        message: 'Platform and URL are required',
      });
    }

    const result = await createSocialHandleService(userId, platform, url);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error in createSocialHandleController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create social handle',
      error: error.message,
    });
  }
}

/**
 * Update a social handle
 * PUT /api/profile/social-handles/:id
 */
async function updateSocialHandleController(req, res) {
  try {
    const { id } = req.params;
    const { platform, url } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Social handle ID is required',
      });
    }

    if (!platform || !url) {
      return res.status(400).json({
        success: false,
        message: 'Platform and URL are required',
      });
    }

    const result = await updateSocialHandleService(id, platform, url);
    res.json(result);
  } catch (error) {
    console.error('Error in updateSocialHandleController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update social handle',
      error: error.message,
    });
  }
}

/**
 * Delete a social handle
 * DELETE /api/profile/social-handles/:id
 */
async function deleteSocialHandleController(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Social handle ID is required',
      });
    }

    const result = await deleteSocialHandleService(id);
    res.json(result);
  } catch (error) {
    console.error('Error in deleteSocialHandleController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete social handle',
      error: error.message,
    });
  }
}

module.exports = {
  getSocialHandlesController,
  createSocialHandleController,
  updateSocialHandleController,
  deleteSocialHandleController,
};

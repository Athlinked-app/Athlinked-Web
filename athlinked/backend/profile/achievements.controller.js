const {
  getAchievementsService,
  createAchievementService,
  updateAchievementService,
  deleteAchievementService,
} = require('./achievements.service');

/**
 * Get achievements for a user
 * GET /api/profile/:userId/achievements
 */
async function getAchievementsController(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const result = await getAchievementsService(userId);
    res.json(result);
  } catch (error) {
    console.error('Error in getAchievementsController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch achievements',
      error: error.message,
    });
  }
}

/**
 * Create a new achievement
 * POST /api/profile/:userId/achievements
 */
async function createAchievementController(req, res) {
  try {
    const { userId } = req.params;
    const data = req.body;

    console.log('Create Achievement - req.file:', req.file);
    console.log('Create Achievement - req.body:', req.body);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    if (!data.title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required',
      });
    }

    // Handle PDF file upload if present
    if (req.file) {
      console.log('PDF file uploaded:', req.file.filename);
      data.mediaPdf = `/uploads/profile/pdfs/${req.file.filename}`;
    } else {
      console.log('No PDF file in request');
    }

    const result = await createAchievementService(userId, data);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error in createAchievementController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create achievement',
      error: error.message,
    });
  }
}

/**
 * Update an achievement
 * PUT /api/profile/achievements/:id
 */
async function updateAchievementController(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;

    console.log('Update Achievement - req.file:', req.file);
    console.log('Update Achievement - req.body:', req.body);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Achievement ID is required',
      });
    }

    // Handle PDF file upload if present
    if (req.file) {
      console.log('PDF file uploaded:', req.file.filename);
      data.mediaPdf = `/uploads/profile/pdfs/${req.file.filename}`;
    } else {
      console.log('No PDF file in request');
    }

    const result = await updateAchievementService(id, data);
    res.json(result);
  } catch (error) {
    console.error('Error in updateAchievementController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update achievement',
      error: error.message,
    });
  }
}

/**
 * Delete an achievement
 * DELETE /api/profile/achievements/:id
 */
async function deleteAchievementController(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Achievement ID is required',
      });
    }

    const result = await deleteAchievementService(id);
    res.json(result);
  } catch (error) {
    console.error('Error in deleteAchievementController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete achievement',
      error: error.message,
    });
  }
}

module.exports = {
  getAchievementsController,
  createAchievementController,
  updateAchievementController,
  deleteAchievementController,
};

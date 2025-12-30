const {
  getHealthReadinessService,
  createHealthReadinessService,
  updateHealthReadinessService,
  deleteHealthReadinessService,
} = require('./health-readiness.service');

/**
 * Get health and readiness for a user
 * GET /api/profile/:userId/health-readiness
 */
async function getHealthReadinessController(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const result = await getHealthReadinessService(userId);
    res.json(result);
  } catch (error) {
    console.error('Error in getHealthReadinessController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health and readiness data',
      error: error.message,
    });
  }
}

/**
 * Create a new health and readiness entry
 * POST /api/profile/:userId/health-readiness
 */
async function createHealthReadinessController(req, res) {
  try {
    const { userId } = req.params;
    const data = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const result = await createHealthReadinessService(userId, data);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error in createHealthReadinessController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create health and readiness data',
      error: error.message,
    });
  }
}

/**
 * Update a health and readiness entry
 * PUT /api/profile/health-readiness/:id
 */
async function updateHealthReadinessController(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Health and readiness ID is required',
      });
    }

    const result = await updateHealthReadinessService(id, data);
    res.json(result);
  } catch (error) {
    console.error('Error in updateHealthReadinessController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update health and readiness data',
      error: error.message,
    });
  }
}

/**
 * Delete a health and readiness entry
 * DELETE /api/profile/health-readiness/:id
 */
async function deleteHealthReadinessController(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Health and readiness ID is required',
      });
    }

    const result = await deleteHealthReadinessService(id);
    res.json(result);
  } catch (error) {
    console.error('Error in deleteHealthReadinessController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete health and readiness data',
      error: error.message,
    });
  }
}

module.exports = {
  getHealthReadinessController,
  createHealthReadinessController,
  updateHealthReadinessController,
  deleteHealthReadinessController,
};


const {
  getAthleticPerformanceService,
  createAthleticPerformanceService,
  updateAthleticPerformanceService,
  deleteAthleticPerformanceService,
} = require('./athletic-performance.service');

/**
 * Get athletic performance for a user
 * GET /api/profile/:userId/athletic-performance
 */
async function getAthleticPerformanceController(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const result = await getAthleticPerformanceService(userId);
    res.json(result);
  } catch (error) {
    console.error('Error in getAthleticPerformanceController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch athletic performance data',
      error: error.message,
    });
  }
}

/**
 * Create a new athletic performance entry
 * POST /api/profile/:userId/athletic-performance
 */
async function createAthleticPerformanceController(req, res) {
  try {
    const { userId } = req.params;
    const data = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const result = await createAthleticPerformanceService(userId, data);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error in createAthleticPerformanceController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create athletic performance data',
      error: error.message,
    });
  }
}

/**
 * Update an athletic performance entry
 * PUT /api/profile/athletic-performance/:id
 */
async function updateAthleticPerformanceController(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Athletic performance ID is required',
      });
    }

    const result = await updateAthleticPerformanceService(id, data);
    res.json(result);
  } catch (error) {
    console.error('Error in updateAthleticPerformanceController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update athletic performance data',
      error: error.message,
    });
  }
}

/**
 * Delete an athletic performance entry
 * DELETE /api/profile/athletic-performance/:id
 */
async function deleteAthleticPerformanceController(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Athletic performance ID is required',
      });
    }

    const result = await deleteAthleticPerformanceService(id);
    res.json(result);
  } catch (error) {
    console.error('Error in deleteAthleticPerformanceController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete athletic performance data',
      error: error.message,
    });
  }
}

module.exports = {
  getAthleticPerformanceController,
  createAthleticPerformanceController,
  updateAthleticPerformanceController,
  deleteAthleticPerformanceController,
};

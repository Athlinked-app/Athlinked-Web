const activityService = require('./activity.service');

/**
 * Get my activity (posts and clips) - only current user's content
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getMyActivity(req, res) {
  try {
    const userId = req.params.userId || req.user?.id;
    const limit = parseInt(req.query.limit, 10) || 50;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const result = await activityService.getMyActivityService(userId, limit);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get my activity error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

module.exports = {
  getMyActivity,
};

const fcmTokensService = require('./fcm-tokens.service');

/**
 * Controller to register or update FCM token
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function registerDevice(req, res) {
  try {
    // Use userId from JWT token (set by authenticateToken middleware)
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const { fcmToken, platform } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required',
      });
    }

    if (!platform) {
      return res.status(400).json({
        success: false,
        message: 'Platform is required (ios, android, or web)',
      });
    }

    const result = await fcmTokensService.registerTokenService(
      userId,
      fcmToken,
      platform
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error('Register device controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/**
 * Controller to get user's FCM tokens
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getUserTokens(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const result = await fcmTokensService.getUserTokensService(userId);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Get user tokens controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/**
 * Controller to remove FCM token
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function removeToken(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required',
      });
    }

    const result = await fcmTokensService.removeTokenService(userId, fcmToken);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Remove token controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

module.exports = {
  registerDevice,
  getUserTokens,
  removeToken,
};

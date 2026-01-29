const fcmTokensModel = require('./fcm-tokens.model');

/**
 * Register or update FCM token service
 * @param {string} userId - User ID
 * @param {string} fcmToken - FCM token string
 * @param {string} platform - Platform (ios, android, web)
 * @returns {Promise<object>} Service result
 */
async function registerTokenService(userId, fcmToken, platform) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!fcmToken) {
      throw new Error('FCM token is required');
    }

    if (!platform) {
      throw new Error('Platform is required');
    }

    // Validate platform
    const validPlatforms = ['ios', 'android', 'web'];
    if (!validPlatforms.includes(platform.toLowerCase())) {
      throw new Error(`Invalid platform. Must be one of: ${validPlatforms.join(', ')}`);
    }

    const tokenRecord = await fcmTokensModel.registerToken(
      userId,
      fcmToken,
      platform.toLowerCase()
    );

    return {
      success: true,
      message: 'FCM token registered successfully',
      token: {
        id: tokenRecord.id,
        platform: tokenRecord.platform,
        createdAt: tokenRecord.created_at,
        updatedAt: tokenRecord.updated_at,
      },
    };
  } catch (error) {
    console.error('Register FCM token service error:', error.message);
    throw error;
  }
}

/**
 * Get user FCM tokens service
 * @param {string} userId - User ID
 * @returns {Promise<object>} Service result with tokens
 */
async function getUserTokensService(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const tokens = await fcmTokensModel.getUserTokens(userId);

    return {
      success: true,
      tokens: tokens.map(token => ({
        id: token.id,
        platform: token.platform,
        createdAt: token.created_at,
        updatedAt: token.updated_at,
      })),
      count: tokens.length,
    };
  } catch (error) {
    console.error('Get user FCM tokens service error:', error.message);
    throw error;
  }
}

/**
 * Remove FCM token service
 * @param {string} userId - User ID
 * @param {string} fcmToken - FCM token to remove
 * @returns {Promise<object>} Service result
 */
async function removeTokenService(userId, fcmToken) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!fcmToken) {
      throw new Error('FCM token is required');
    }

    const removed = await fcmTokensModel.removeToken(userId, fcmToken);

    if (!removed) {
      return {
        success: false,
        message: 'FCM token not found',
      };
    }

    return {
      success: true,
      message: 'FCM token removed successfully',
    };
  } catch (error) {
    console.error('Remove FCM token service error:', error.message);
    throw error;
  }
}

module.exports = {
  registerTokenService,
  getUserTokensService,
  removeTokenService,
};

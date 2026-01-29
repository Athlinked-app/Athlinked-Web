const admin = require('../config/firebase');
const fcmTokensModel = require('../notifications/fcm-tokens.model');

/**
 * Send push notification to a user
 * @param {string} userId - User ID to send notification to
 * @param {string} title - Notification title
 * @param {string} body - Notification body text
 * @param {object} dataPayload - Custom data payload for app navigation (optional)
 * @returns {Promise<object>} Result object with success count and failure count
 */
async function sendPushToUser(userId, title, body, dataPayload = {}) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!title || !body) {
      throw new Error('Title and body are required');
    }

    // 1. Get tokens from Postgres
    const tokens = await fcmTokensModel.getUserTokensForNotification(userId);

    if (tokens.length === 0) {
      console.log(`No FCM tokens found for user ${userId}`);
      return {
        success: true,
        successCount: 0,
        failureCount: 0,
        message: 'No FCM tokens found for user',
      };
    }

    // 2. Construct message
    // Convert dataPayload values to strings (FCM requires string values)
    const stringifiedData = {};
    for (const [key, value] of Object.entries(dataPayload)) {
      stringifiedData[key] = String(value);
    }

    const message = {
      notification: {
        title: title,
        body: body,
      },
      data: stringifiedData, // Custom data for app navigation
      tokens: tokens, // Send to all user's devices
    };

    // 3. Send using Firebase Admin SDK
    const response = await admin.messaging().sendMulticast(message);

    console.log(`Push notification sent to user ${userId}:`, {
      successCount: response.successCount,
      failureCount: response.failureCount,
      totalTokens: tokens.length,
    });

    // 4. Handle invalid tokens (clean up from database)
    if (response.failureCount > 0) {
      const invalidTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          // Check if token is invalid (unregistered, expired, etc.)
          if (
            resp.error?.code === 'messaging/invalid-registration-token' ||
            resp.error?.code === 'messaging/registration-token-not-registered' ||
            resp.error?.code === 'messaging/invalid-argument'
          ) {
            invalidTokens.push(tokens[idx]);
            console.log(`Invalid token detected: ${tokens[idx]}`, resp.error);
          }
        }
      });

      // Remove invalid tokens from database
      if (invalidTokens.length > 0) {
        const removedCount = await fcmTokensModel.removeInvalidTokens(invalidTokens);
        console.log(`Removed ${removedCount} invalid FCM tokens from database`);
      }
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      totalTokens: tokens.length,
      message: `${response.successCount} messages were sent successfully`,
    };
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

/**
 * Send push notification to multiple users
 * @param {Array<string>} userIds - Array of user IDs to send notification to
 * @param {string} title - Notification title
 * @param {string} body - Notification body text
 * @param {object} dataPayload - Custom data payload for app navigation (optional)
 * @returns {Promise<object>} Result object with success count and failure count
 */
async function sendPushToMultipleUsers(userIds, title, body, dataPayload = {}) {
  try {
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('User IDs array is required');
    }

    let totalSuccess = 0;
    let totalFailure = 0;

    // Send to each user individually (Firebase handles batching per user's devices)
    for (const userId of userIds) {
      try {
        const result = await sendPushToUser(userId, title, body, dataPayload);
        totalSuccess += result.successCount;
        totalFailure += result.failureCount;
      } catch (error) {
        console.error(`Error sending push to user ${userId}:`, error);
        totalFailure++;
      }
    }

    return {
      success: true,
      successCount: totalSuccess,
      failureCount: totalFailure,
      totalUsers: userIds.length,
      message: `Sent notifications to ${userIds.length} users`,
    };
  } catch (error) {
    console.error('Error sending push notifications to multiple users:', error);
    throw error;
  }
}

module.exports = {
  sendPushToUser,
  sendPushToMultipleUsers,
};

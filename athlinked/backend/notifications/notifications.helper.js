const notificationModel = require('./notifications.model');

/**
 * Helper function to create a notification
 * This is for INTERNAL USE ONLY - not exposed as a public API
 * 
 * @param {object} options - Notification options
 * @param {string} options.recipientUserId - User ID who will receive the notification
 * @param {string} [options.actorUserId] - User ID who performed the action (nullable)
 * @param {string} options.actorFullName - Full name of the user who performed the action
 * @param {string} options.type - Notification type: 'like', 'comment', 'mention', 'follow_request', 'follow_accepted'
 * @param {string} options.entityType - Entity type: 'post', 'comment', 'profile', 'clip'
 * @param {string} options.entityId - ID of the entity (post ID, comment ID, etc.)
 * @param {string} options.message - Pre-built message text
 * @returns {Promise<object>} Created notification
 * 
 * @example
 * await createNotification({
 *   recipientUserId: 'user-uuid',
 *   actorUserId: 'actor-uuid',
 *   actorFullName: 'John Doe',
 *   type: 'like',
 *   entityType: 'post',
 *   entityId: 'post-uuid',
 *   message: 'John Doe liked your post'
 * });
 */
async function createNotification(options) {
  const {
    recipientUserId,
    actorUserId,
    actorFullName,
    type,
    entityType,
    entityId,
    message,
  } = options;

  // Validate required fields
  if (!recipientUserId) {
    throw new Error('recipientUserId is required');
  }

  if (!actorFullName) {
    throw new Error('actorFullName is required');
  }

  if (!type) {
    throw new Error('type is required');
  }

  if (!entityType) {
    throw new Error('entityType is required');
  }

  if (!entityId) {
    throw new Error('entityId is required');
  }

  if (!message) {
    throw new Error('message is required');
  }

  // Never create notification for self-action
  if (actorUserId && actorUserId === recipientUserId) {
    console.log('Skipping notification: user cannot notify themselves');
    return null;
  }

  try {
    const notification = await notificationModel.createNotification({
      recipientUserId,
      actorUserId: actorUserId || null,
      actorFullName,
      type,
      entityType,
      entityId,
      message,
    });

    console.log('Notification created successfully:', notification.id);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

module.exports = {
  createNotification,
};


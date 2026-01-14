const notificationModel = require('./notifications.model');

/**
 * Emit notification via WebSocket
 */
function emitNotification(io, notification) {
  if (!io || !notification) return;

  try {
    // Emit to the recipient user's room
    io.to(`user:${notification.recipient_user_id}`).emit('new_notification', {
      id: notification.id,
      actorFullName: notification.actor_full_name,
      type: notification.type,
      message: notification.message,
      entityType: notification.entity_type,
      entityId: notification.entity_id,
      isRead: notification.is_read,
      createdAt: notification.created_at,
    });

    // Emit notification count update
    notificationModel
      .getUnreadCount(notification.recipient_user_id)
      .then(count => {
        io.to(`user:${notification.recipient_user_id}`).emit(
          'notification_count_update',
          {
            count,
          }
        );
      })
      .catch(err => {
        console.error('Error fetching unread count for WebSocket:', err);
      });
  } catch (error) {
    console.error('Error emitting notification via WebSocket:', error);
  }
}

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

    // Emit via WebSocket if available
    try {
      const app = require('../app');
      const io = app.get('io');
      if (io) {
        emitNotification(io, notification);
      }
    } catch (error) {
      console.error('Error emitting notification via WebSocket:', error);
      // Don't throw - notification was created successfully
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

module.exports = {
  createNotification,
  emitNotification,
};

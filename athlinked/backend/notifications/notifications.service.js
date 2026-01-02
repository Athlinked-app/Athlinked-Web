const notificationModel = require('./notifications.model');

/**
 * Get notifications service
 * @param {string} recipientUserId - User ID
 * @param {number} limit - Maximum number of notifications
 * @param {number} offset - Number of notifications to skip
 * @returns {Promise<object>} Service result with notifications
 */
async function getNotificationsService(
  recipientUserId,
  limit = 20,
  offset = 0
) {
  try {
    if (!recipientUserId) {
      throw new Error('Recipient user ID is required');
    }

    // Validate limit and offset
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const parsedOffset = Math.max(0, parseInt(offset, 10) || 0);

    const notifications = await notificationModel.getNotifications(
      recipientUserId,
      parsedLimit,
      parsedOffset
    );

    // Format notifications for API response
    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      actorFullName: notification.actor_full_name,
      type: notification.type,
      message: notification.message,
      entityType: notification.entity_type,
      entityId: notification.entity_id,
      isRead: notification.is_read,
      createdAt: notification.created_at,
    }));

    return {
      success: true,
      notifications: formattedNotifications,
      count: formattedNotifications.length,
    };
  } catch (error) {
    console.error('Get notifications service error:', error.message);
    throw error;
  }
}

/**
 * Get unread notification count service
 * @param {string} recipientUserId - User ID
 * @returns {Promise<object>} Service result with unread count
 */
async function getUnreadCountService(recipientUserId) {
  try {
    if (!recipientUserId) {
      throw new Error('Recipient user ID is required');
    }

    const unreadCount = await notificationModel.getUnreadCount(recipientUserId);

    return {
      success: true,
      unreadCount,
    };
  } catch (error) {
    console.error('Get unread count service error:', error.message);
    throw error;
  }
}

/**
 * Mark notification as read service
 * @param {string} notificationId - Notification ID
 * @param {string} recipientUserId - User ID (for security check)
 * @returns {Promise<object>} Service result
 */
async function markAsReadService(notificationId, recipientUserId) {
  try {
    if (!notificationId) {
      throw new Error('Notification ID is required');
    }

    if (!recipientUserId) {
      throw new Error('Recipient user ID is required');
    }

    const notification = await notificationModel.markAsRead(
      notificationId,
      recipientUserId
    );

    if (!notification) {
      return {
        success: false,
        message:
          'Notification not found or you do not have permission to mark it as read',
      };
    }

    return {
      success: true,
      message: 'Notification marked as read',
      notification: {
        id: notification.id,
        isRead: notification.is_read,
      },
    };
  } catch (error) {
    console.error('Mark notification as read service error:', error.message);
    throw error;
  }
}

/**
 * Mark all notifications as read service
 * @param {string} recipientUserId - User ID
 * @returns {Promise<object>} Service result
 */
async function markAllAsReadService(recipientUserId) {
  try {
    if (!recipientUserId) {
      throw new Error('Recipient user ID is required');
    }

    const updatedCount = await notificationModel.markAllAsRead(recipientUserId);

    return {
      success: true,
      message: 'All notifications marked as read',
      updatedCount,
    };
  } catch (error) {
    console.error(
      'Mark all notifications as read service error:',
      error.message
    );
    throw error;
  }
}

/**
 * Delete notification service
 * @param {string} notificationId - Notification ID
 * @param {string} recipientUserId - User ID (for security check)
 * @returns {Promise<object>} Service result
 */
async function deleteNotificationService(notificationId, recipientUserId) {
  try {
    if (!notificationId) {
      throw new Error('Notification ID is required');
    }

    if (!recipientUserId) {
      throw new Error('Recipient user ID is required');
    }

    const deleted = await notificationModel.deleteNotification(
      notificationId,
      recipientUserId
    );

    if (!deleted) {
      return {
        success: false,
        message:
          'Notification not found or you do not have permission to delete it',
      };
    }

    return {
      success: true,
      message: 'Notification deleted successfully',
    };
  } catch (error) {
    console.error('Delete notification service error:', error.message);
    throw error;
  }
}

module.exports = {
  getNotificationsService,
  getUnreadCountService,
  markAsReadService,
  markAllAsReadService,
  deleteNotificationService,
};

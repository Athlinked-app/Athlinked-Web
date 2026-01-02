const notificationService = require('./notifications.service');

/**
 * Controller to get notifications
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getNotifications(req, res) {
  try {
    // Use userId from JWT token (set by authenticateToken middleware)
    const recipientUserId = req.user?.id;

    if (!recipientUserId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = parseInt(req.query.offset, 10) || 0;

    const result = await notificationService.getNotificationsService(
      recipientUserId,
      limit,
      offset
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error('Get notifications controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/**
 * Controller to get unread notification count
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getUnreadCount(req, res) {
  try {
    const recipientUserId = req.user?.id;

    if (!recipientUserId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const result =
      await notificationService.getUnreadCountService(recipientUserId);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Get unread count controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/**
 * Controller to mark a notification as read
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function markAsRead(req, res) {
  try {
    const recipientUserId = req.user?.id;

    if (!recipientUserId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const notificationId = req.params.id;

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: 'Notification ID is required',
      });
    }

    const result = await notificationService.markAsReadService(
      notificationId,
      recipientUserId
    );

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Mark notification as read controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/**
 * Controller to mark all notifications as read
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function markAllAsRead(req, res) {
  try {
    const recipientUserId = req.user?.id;

    if (!recipientUserId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const result =
      await notificationService.markAllAsReadService(recipientUserId);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Mark all notifications as read controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const notificationController = require('./notifications.controller');

/**
 * GET /api/notifications
 * Get notifications for the logged-in user
 * Auth required
 */
router.get('/', authenticateToken, notificationController.getNotifications);

/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 * Auth required
 */
router.get(
  '/unread-count',
  authenticateToken,
  notificationController.getUnreadCount
);

/**
 * POST /api/notifications/:id/read
 * Mark a notification as read
 * Auth required
 */
router.post('/:id/read', authenticateToken, notificationController.markAsRead);

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read
 * Auth required
 * NOTE: Must be before /:id/read route to avoid matching "read-all" as id
 */
router.post(
  '/read-all',
  authenticateToken,
  notificationController.markAllAsRead
);

module.exports = router;

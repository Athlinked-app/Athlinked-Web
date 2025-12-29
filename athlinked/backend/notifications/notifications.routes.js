const express = require('express');
const router = express.Router();
const notificationController = require('./notifications.controller');

/**
 * GET /api/notifications
 * Get notifications for the logged-in user
 * Auth required
 */
router.get('/', notificationController.getNotifications);

/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 * Auth required
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * POST /api/notifications/:id/read
 * Mark a notification as read
 * Auth required
 */
router.post('/:id/read', notificationController.markAsRead);

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read
 * Auth required
 * NOTE: Must be before /:id/read route to avoid matching "read-all" as id
 */
router.post('/read-all', notificationController.markAllAsRead);

module.exports = router;


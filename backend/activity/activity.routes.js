const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const activityController = require('./activity.controller');

/**
 * @swagger
 * /api/my-activity:
 *   get:
 *     summary: Get my activity (posts and clips) - current user
 *     description: Retrieve all posts (photo, video, article, event, text) and clips created by the authenticated user only
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of items to return per type
 *     responses:
 *       200:
 *         description: Activity retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 posts:
 *                   type: array
 *                   description: User's posts (photo, video, article, event, text)
 *                 clips:
 *                   type: array
 *                   description: User's clips
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, activityController.getMyActivity);

/**
 * @swagger
 * /api/my-activity/{userId}:
 *   get:
 *     summary: Get my activity (posts and clips) - specific user
 *     description: Retrieve all posts (photo, video, article, event, text) and clips created by the specified user only
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of items to return per type
 *     responses:
 *       200:
 *         description: Activity retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 posts:
 *                   type: array
 *                   description: User's posts (photo, video, article, event, text)
 *                 clips:
 *                   type: array
 *                   description: User's clips
 *       401:
 *         description: Unauthorized
 */
router.get('/:userId', authenticateToken, activityController.getMyActivity);

module.exports = router;

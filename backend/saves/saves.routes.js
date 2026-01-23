const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const savesController = require('./saves.controller');

/**
 * @swagger
 * /api/save:
 *   post:
 *     summary: Save a post or clip
 *     description: Unified endpoint to save posts (photos, videos, events, articles) or clips
 *     tags: [Saves]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - id
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [post, clip]
 *                 description: Type of item to save
 *               id:
 *                 type: string
 *                 description: Post ID or Clip ID
 *               user_id:
 *                 type: string
 *                 description: User ID (optional if token provides user)
 *     responses:
 *       200:
 *         description: Item saved successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Item not found
 */
/**
 * @swagger
 * /api/save/unsave:
 *   post:
 *     summary: Unsave a post or clip
 *     description: Unified endpoint to unsave posts or clips
 *     tags: [Saves]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - id
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [post, clip]
 *                 description: Type of item to unsave
 *               id:
 *                 type: string
 *                 description: Post ID or Clip ID
 *               user_id:
 *                 type: string
 *                 description: User ID (optional if token provides user)
 *     responses:
 *       200:
 *         description: Item unsaved successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Item not found
 */
router.post('/unsave', authenticateToken, savesController.unsaveItem);

/**
 * @swagger
 * /api/save/saved/{userId}:
 *   get:
 *     summary: Get all saved items for a user
 *     description: Retrieve all saved posts and clips for a specific user in a single call
 *     tags: [Saves]
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
 *         description: Saved items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 posts:
 *                   type: array
 *                   description: Saved posts (photos, videos, events, articles)
 *                 clips:
 *                   type: array
 *                   description: Saved clips
 *       401:
 *         description: Unauthorized
 */
router.get('/saved/:userId', authenticateToken, savesController.getSavedItems);

/**
 * @swagger
 * /api/save:
 *   post:
 *     summary: Save a post or clip
 *     description: Unified endpoint to save posts (photos, videos, events, articles) or clips
 *     tags: [Saves]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - id
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [post, clip]
 *                 description: Type of item to save
 *               id:
 *                 type: string
 *                 description: Post ID or Clip ID
 *               user_id:
 *                 type: string
 *                 description: User ID (optional if token provides user)
 *     responses:
 *       200:
 *         description: Item saved successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Item not found
 */
router.post('/', authenticateToken, savesController.saveItem);

module.exports = router;

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const clipsController = require('../clips/clips.controller');

/**
 * @swagger
 * /api/comments/{commentId}/reply:
 *   post:
 *     summary: Reply to a comment
 *     description: Add a reply to an existing comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID to reply to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reply
 *             properties:
 *               reply:
 *                 type: string
 *                 example: "I agree with this comment"
 *     responses:
 *       201:
 *         description: Reply added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 reply:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/:commentId/reply',
  authenticateToken,
  clipsController.replyToComment
);

module.exports = router;

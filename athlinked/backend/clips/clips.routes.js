const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const clipsController = require('./clips.controller');
const upload = require('../utils/upload');

/**
 * @swagger
 * /api/clips:
 *   post:
 *     summary: Create a new clip
 *     description: Upload and create a new video clip (max 50MB)
 *     tags: [Clips]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Video file (max 50MB)
 *     responses:
 *       201:
 *         description: Clip created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 clip:
 *                   type: object
 *       400:
 *         description: Bad request or file too large
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/',
  authenticateToken,
  (req, res, next) => {
    upload.single('video')(req, res, err => {
      if (err) {
        // Handle multer errors
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File size too large. Maximum size is 50MB',
          });
        }
        if (err.message) {
          return res.status(400).json({
            success: false,
            message: err.message,
          });
        }
        return res.status(400).json({
          success: false,
          message: 'File upload error',
        });
      }
      next();
    });
  },
  clipsController.createClip
);

/**
 * @swagger
 * /api/clips:
 *   get:
 *     summary: Get clips feed
 *     description: Retrieve clips feed with pagination
 *     tags: [Clips]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of clips per page
 *     responses:
 *       200:
 *         description: Clips retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 clips:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/', clipsController.getClipsFeed);

/**
 * @swagger
 * /api/clips/{clipId}/comments:
 *   post:
 *     summary: Add a comment to a clip
 *     description: Add a comment to a specific clip
 *     tags: [Clips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clipId
 *         required: true
 *         schema:
 *           type: string
 *         description: Clip ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment
 *             properties:
 *               comment:
 *                 type: string
 *                 example: "Great clip!"
 *     responses:
 *       201:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:clipId/comments', authenticateToken, clipsController.addComment);

/**
 * @swagger
 * /api/clips/{clipId}/comments:
 *   get:
 *     summary: Get comments for a clip
 *     description: Retrieve all comments for a clip with nested replies
 *     tags: [Clips]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: clipId
 *         required: true
 *         schema:
 *           type: string
 *         description: Clip ID
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 comments:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/:clipId/comments', clipsController.getClipComments);

/**
 * @swagger
 * /api/clips/comments/{commentId}/reply:
 *   post:
 *     summary: Reply to a comment
 *     description: Add a reply to an existing comment on a clip
 *     tags: [Clips]
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
 *               - comment
 *             properties:
 *               comment:
 *                 type: string
 *                 example: "Great point!"
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
 *                 comment:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Parent comment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/comments/:commentId/reply',
  authenticateToken,
  clipsController.replyToComment
);

/**
 * @swagger
 * /api/clips/{clipId}:
 *   delete:
 *     summary: Delete a clip
 *     description: Delete a clip by ID
 *     tags: [Clips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clipId
 *         required: true
 *         schema:
 *           type: string
 *         description: Clip ID
 *     responses:
 *       200:
 *         description: Clip deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Clip not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:clipId', authenticateToken, clipsController.deleteClip);

module.exports = router;

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const clipsController = require('./clips.controller');
const upload = require('../utils/upload');

/**
 * POST /api/clips
 * Create a new clip
 * Auth required
 */
router.post(
  '/',
  authenticateToken,
  (req, res, next) => {
    upload.single('video')(req, res, (err) => {
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
 * GET /api/clips
 * Get clips feed with pagination
 */
router.get('/', clipsController.getClipsFeed);

/**
 * POST /api/clips/:clipId/comments
 * Add a comment to a clip
 * Auth required
 */
router.post('/:clipId/comments', authenticateToken, clipsController.addComment);

/**
 * GET /api/clips/:clipId/comments
 * Get comments for a clip with nested replies
 */
router.get('/:clipId/comments', clipsController.getClipComments);

/**
 * DELETE /api/clips/:clipId
 * Delete a clip
 * Auth required
 */
router.delete('/:clipId', authenticateToken, clipsController.deleteClip);

module.exports = router;

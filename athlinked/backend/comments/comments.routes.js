const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const clipsController = require('../clips/clips.controller');

/**
 * POST /api/comments/:commentId/reply
 * Reply to a comment
 * Auth required
 */
router.post(
  '/:commentId/reply',
  authenticateToken,
  clipsController.replyToComment
);

module.exports = router;

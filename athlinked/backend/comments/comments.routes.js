const express = require('express');
const router = express.Router();
const clipsController = require('../clips/clips.controller');

/**
 * POST /api/comments/:commentId/reply
 * Reply to a comment
 * Auth required
 */
router.post('/:commentId/reply', clipsController.replyToComment);

module.exports = router;

const express = require('express');
const router = express.Router();
const clipsController = require('./clips.controller');
const upload = require('../utils/upload');

/**
 * POST /api/clips
 * Create a new clip
 * Auth required
 */
router.post('/', upload.single('video'), clipsController.createClip);

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
router.post('/:clipId/comments', clipsController.addComment);

/**
 * GET /api/clips/:clipId/comments
 * Get comments for a clip with nested replies
 */
router.get('/:clipId/comments', clipsController.getClipComments);

module.exports = router;

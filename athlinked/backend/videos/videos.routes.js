const express = require('express');
const router = express.Router();
const videosController = require('./videos.controller');
const upload = require('../utils/upload-resources');

/**
 * POST /api/videos
 * Create a new video
 * Auth required - user_id in body or req.user.id
 */
router.post('/', upload.single('file'), videosController.createVideo);

/**
 * GET /api/videos
 * Get all active videos
 */
router.get('/', videosController.getAllVideos);

/**
 * DELETE /api/videos/:id
 * Soft delete a video (set is_active = false)
 * Auth required - user_id in body or req.user.id
 */
router.delete('/:id', videosController.deleteVideo);

module.exports = router;

const express = require('express');
const router = express.Router();
const profileController = require('./profile.controller');

/**
 * POST /api/profile/upload
 * Upload profile or cover image
 * NOTE: Must be before other routes to avoid conflicts
 */
// This route is handled by profile-upload.routes.js

/**
 * POST /api/profile/images
 * Update profile images only
 * Auth required
 * NOTE: Must be before /:userId route to avoid matching "images" as userId
 */
router.post('/images', profileController.updateProfileImages);

/**
 * POST /api/profile
 * Create or update user profile (UPSERT)
 * Auth required
 */
router.post('/', profileController.upsertUserProfile);

/**
 * GET /api/profile/:userId
 * Get user profile
 */
router.get('/:userId', profileController.getUserProfile);

module.exports = router;

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const resourcesController = require('./resources.controller');
const upload = require('../utils/upload-resources');

/**
 * POST /api/resources
 * Create a new resource
 * Auth required - user_id in body or req.user.id
 */
router.post(
  '/',
  authenticateToken,
  upload.single('file'),
  resourcesController.createResource
);

/**
 * GET /api/resources
 * Get all active resources
 * Query param: type (optional) - filter by resource_type (article, video, template)
 */
router.get('/', resourcesController.getAllResources);

/**
 * DELETE /api/resources/:id
 * Soft delete a resource (set is_active = false)
 * Auth required - user_id in body or req.user.id
 */
router.delete('/:id', authenticateToken, resourcesController.deleteResource);

module.exports = router;

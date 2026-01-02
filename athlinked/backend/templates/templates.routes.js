const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const templatesController = require('./templates.controller');
const upload = require('../utils/upload-resources');

/**
 * POST /api/templates
 * Create a new template
 * Auth required - user_id in body or req.user.id
 */
router.post(
  '/',
  authenticateToken,
  upload.single('file'),
  templatesController.createTemplate
);

/**
 * GET /api/templates
 * Get all active templates
 */
router.get('/', templatesController.getAllTemplates);

/**
 * DELETE /api/templates/:id
 * Soft delete a template (set is_active = false)
 * Auth required - user_id in body or req.user.id
 */
router.delete('/:id', authenticateToken, templatesController.deleteTemplate);

module.exports = router;

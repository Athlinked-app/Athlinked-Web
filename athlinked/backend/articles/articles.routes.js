const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const articlesController = require('./articles.controller');

/**
 * POST /api/articles
 * Create a new article
 * Auth required - user_id in body or req.user.id
 */
router.post('/', authenticateToken, articlesController.createArticle);

/**
 * GET /api/articles
 * Get all active articles
 */
router.get('/', articlesController.getAllArticles);

/**
 * DELETE /api/articles/:id
 * Soft delete an article (set is_active = false)
 * Auth required - user_id in body or req.user.id
 */
router.delete('/:id', authenticateToken, articlesController.deleteArticle);

module.exports = router;

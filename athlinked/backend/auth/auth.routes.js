const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const refreshTokensController = require('./refresh-tokens.controller');

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 * Public endpoint - no authentication required
 */
router.post('/refresh', refreshTokensController.refreshToken);

/**
 * POST /api/auth/logout
 * Revoke refresh token (logout)
 * Public endpoint - refresh token in body
 */
router.post('/logout', refreshTokensController.logout);

/**
 * POST /api/auth/logout-all
 * Revoke all refresh tokens for current user (logout from all devices)
 * Requires authentication
 */
router.post(
  '/logout-all',
  authenticateToken,
  refreshTokensController.logoutAll
);

module.exports = router;

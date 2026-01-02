const express = require('express');
const router = express.Router();
const favoritesController = require('./favorites.controller');
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /api/favorites/:athleteId
 * Add an athlete to coach's favorites
 * Auth required
 */
router.post(
  '/:athleteId',
  authenticateToken,
  favoritesController.addFavorite
);

/**
 * DELETE /api/favorites/:athleteId
 * Remove an athlete from coach's favorites
 * Auth required
 */
router.delete(
  '/:athleteId',
  authenticateToken,
  favoritesController.removeFavorite
);

/**
 * GET /api/favorites/:athleteId/status
 * Check if athlete is in coach's favorites
 * Auth required
 */
router.get(
  '/:athleteId/status',
  authenticateToken,
  favoritesController.checkFavoriteStatus
);

/**
 * GET /api/favorites
 * Get all favorites for the authenticated coach
 * Auth required
 */
router.get('/', authenticateToken, favoritesController.getFavorites);

module.exports = router;


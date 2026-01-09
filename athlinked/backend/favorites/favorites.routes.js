const express = require('express');
const router = express.Router();
const favoritesController = require('./favorites.controller');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Get all favorites
 *     description: Get all favorite athletes for the authenticated coach
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Favorites retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 favorites:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authenticateToken, favoritesController.getFavorites);

/**
 * @swagger
 * /api/favorites/{athleteId}:
 *   post:
 *     summary: Add athlete to favorites
 *     description: Add an athlete to coach's favorites list
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: athleteId
 *         required: true
 *         schema:
 *           type: string
 *         description: Athlete ID
 *     responses:
 *       200:
 *         description: Athlete added to favorites
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:athleteId', authenticateToken, favoritesController.addFavorite);

/**
 * @swagger
 * /api/favorites/{athleteId}:
 *   delete:
 *     summary: Remove athlete from favorites
 *     description: Remove an athlete from coach's favorites list
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: athleteId
 *         required: true
 *         schema:
 *           type: string
 *         description: Athlete ID
 *     responses:
 *       200:
 *         description: Athlete removed from favorites
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/:athleteId',
  authenticateToken,
  favoritesController.removeFavorite
);

/**
 * @swagger
 * /api/favorites/{athleteId}/status:
 *   get:
 *     summary: Check favorite status
 *     description: Check if an athlete is in coach's favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: athleteId
 *         required: true
 *         schema:
 *           type: string
 *         description: Athlete ID
 *     responses:
 *       200:
 *         description: Favorite status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 isFavorite:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/:athleteId/status',
  authenticateToken,
  favoritesController.checkFavoriteStatus
);

module.exports = router;

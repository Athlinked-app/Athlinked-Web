const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const statsController = require('./stats.controller');

/**
 * @swagger
 * /api/sports:
 *   get:
 *     summary: Get all sports
 *     description: Retrieve all available sports
 *     tags: [Stats]
 *     security: []
 *     responses:
 *       200:
 *         description: Sports retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 sports:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/sports', statsController.getAllSports);

/**
 * @swagger
 * /api/sports/{sportId}/positions:
 *   get:
 *     summary: Get positions for a sport
 *     description: Retrieve all positions available for a specific sport
 *     tags: [Stats]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: sportId
 *         required: true
 *         schema:
 *           type: string
 *         description: Sport ID
 *     responses:
 *       200:
 *         description: Positions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 positions:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/sports/:sportId/positions', statsController.getPositionsBySport);

/**
 * @swagger
 * /api/positions/{positionId}/fields:
 *   get:
 *     summary: Get fields for a position
 *     description: Retrieve all fields/stats available for a specific position
 *     tags: [Stats]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: positionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Position ID
 *     responses:
 *       200:
 *         description: Fields retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 fields:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get(
  '/positions/:positionId/fields',
  statsController.getFieldsByPosition
);

/**
 * @swagger
 * /api/user-sport-profile:
 *   post:
 *     summary: Create or update user sport profile
 *     description: Create or update a user's sport profile
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sportId
 *             properties:
 *               sportId:
 *                 type: string
 *                 example: "sport-id-123"
 *               positionId:
 *                 type: string
 *                 example: "position-id-456"
 *     responses:
 *       200:
 *         description: Sport profile created or updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 profile:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/user-sport-profile',
  authenticateToken,
  statsController.createOrUpdateUserSportProfile
);

/**
 * @swagger
 * /api/user/position-stats:
 *   post:
 *     summary: Save user position stats
 *     description: Save statistics for a user's position
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - profileId
 *               - stats
 *             properties:
 *               profileId:
 *                 type: string
 *                 example: "profile-id-123"
 *               stats:
 *                 type: object
 *                 description: Statistics data
 *     responses:
 *       200:
 *         description: Stats saved successfully
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
router.post(
  '/user/position-stats',
  authenticateToken,
  statsController.saveUserPositionStats
);

/**
 * @swagger
 * /api/user/sport-profile/{id}/stats:
 *   get:
 *     summary: Get user stats for a sport
 *     description: Retrieve statistics for a user's sport profile
 *     tags: [Stats]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sport profile ID
 *     responses:
 *       200:
 *         description: Stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 stats:
 *                   type: object
 */
router.get(
  '/user/sport-profile/:id/stats',
  statsController.getUserStatsByProfile
);

/**
 * @swagger
 * /api/user/{userId}/sport-profiles:
 *   get:
 *     summary: Get all user sport profiles
 *     description: Retrieve all sport profiles with stats for a user
 *     tags: [Stats]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Sport profiles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 profiles:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get(
  '/user/:userId/sport-profiles',
  statsController.getAllUserSportProfiles
);

module.exports = router;

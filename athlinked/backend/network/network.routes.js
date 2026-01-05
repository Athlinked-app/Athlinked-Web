const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const networkController = require('./network.controller');

/**
 * @swagger
 * /api/network/follow/{userId}:
 *   post:
 *     summary: Follow a user
 *     description: Follow another user
 *     tags: [Network]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to follow
 *     responses:
 *       200:
 *         description: User followed successfully
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
router.post('/follow/:userId', authenticateToken, networkController.followUser);

/**
 * @swagger
 * /api/network/unfollow/{userId}:
 *   post:
 *     summary: Unfollow a user
 *     description: Unfollow a user
 *     tags: [Network]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to unfollow
 *     responses:
 *       200:
 *         description: User unfollowed successfully
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
  '/unfollow/:userId',
  authenticateToken,
  networkController.unfollowUser
);

/**
 * @swagger
 * /api/network/followers/{userId}:
 *   get:
 *     summary: Get followers list
 *     description: Get list of users following a specific user
 *     tags: [Network]
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
 *         description: Followers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 followers:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/followers/:userId', networkController.getFollowers);

/**
 * @swagger
 * /api/network/following/{userId}:
 *   get:
 *     summary: Get following list
 *     description: Get list of users that a specific user is following
 *     tags: [Network]
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
 *         description: Following list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 following:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/following/:userId', networkController.getFollowing);

/**
 * @swagger
 * /api/network/counts/{userId}:
 *   get:
 *     summary: Get follow counts
 *     description: Get follower and following counts for a user
 *     tags: [Network]
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
 *         description: Follow counts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 followersCount:
 *                   type: integer
 *                   example: 150
 *                 followingCount:
 *                   type: integer
 *                   example: 75
 */
router.get('/counts/:userId', networkController.getFollowCounts);

/**
 * @swagger
 * /api/network/is-following/{userId}:
 *   get:
 *     summary: Check if following user
 *     description: Check if the current user is following a specific user
 *     tags: [Network]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to check
 *     responses:
 *       200:
 *         description: Following status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 isFollowing:
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
  '/is-following/:userId',
  authenticateToken,
  networkController.isFollowing
);

/**
 * @swagger
 * /api/network/connect/{userId}:
 *   post:
 *     summary: Send connection request
 *     description: Send a connection request to another user
 *     tags: [Network]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to connect with
 *     responses:
 *       200:
 *         description: Connection request sent successfully
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
  '/connect/:userId',
  authenticateToken,
  networkController.sendConnectionRequest
);

/**
 * @swagger
 * /api/network/accept/{requestId}:
 *   post:
 *     summary: Accept connection request
 *     description: Accept a pending connection request
 *     tags: [Network]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: Connection request ID
 *     responses:
 *       200:
 *         description: Connection request accepted
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
  '/accept/:requestId',
  authenticateToken,
  networkController.acceptConnectionRequest
);

/**
 * @swagger
 * /api/network/reject/{requestId}:
 *   post:
 *     summary: Reject connection request
 *     description: Reject a pending connection request
 *     tags: [Network]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: Connection request ID
 *     responses:
 *       200:
 *         description: Connection request rejected
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
  '/reject/:requestId',
  authenticateToken,
  networkController.rejectConnectionRequest
);

/**
 * @swagger
 * /api/network/invitations:
 *   get:
 *     summary: Get connection requests
 *     description: Get all pending connection requests for the current user
 *     tags: [Network]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Connection requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 requests:
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
router.get(
  '/invitations',
  authenticateToken,
  networkController.getConnectionRequests
);

/**
 * @swagger
 * /api/network/connection-status/{userId}:
 *   get:
 *     summary: Check connection request status
 *     description: Check the status of a connection request with a specific user
 *     tags: [Network]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to check connection status with
 *     responses:
 *       200:
 *         description: Connection status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   example: "pending"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/connection-status/:userId',
  authenticateToken,
  networkController.checkConnectionRequestStatus
);

module.exports = router;

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const networkController = require('./network.controller');

/**
 * POST /api/network/follow/:userId
 * Follow a user
 * Auth required
 */
router.post('/follow/:userId', authenticateToken, networkController.followUser);

/**
 * POST /api/network/unfollow/:userId
 * Unfollow a user
 * Auth required
 */
router.post(
  '/unfollow/:userId',
  authenticateToken,
  networkController.unfollowUser
);

/**
 * GET /api/network/followers/:userId
 * Get followers list for a user
 */
router.get('/followers/:userId', networkController.getFollowers);

/**
 * GET /api/network/following/:userId
 * Get following list for a user
 */
router.get('/following/:userId', networkController.getFollowing);

/**
 * GET /api/network/counts/:userId
 * Get follow counts for a user
 */
router.get('/counts/:userId', networkController.getFollowCounts);

router.get(
  '/is-following/:userId',
  authenticateToken,
  networkController.isFollowing
);

router.post(
  '/connect/:userId',
  authenticateToken,
  networkController.sendConnectionRequest
);

router.post(
  '/accept/:requestId',
  authenticateToken,
  networkController.acceptConnectionRequest
);

router.post(
  '/reject/:requestId',
  authenticateToken,
  networkController.rejectConnectionRequest
);

router.get(
  '/invitations',
  authenticateToken,
  networkController.getConnectionRequests
);

router.get(
  '/connection-status/:userId',
  authenticateToken,
  networkController.checkConnectionRequestStatus
);

module.exports = router;

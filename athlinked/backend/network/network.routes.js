const express = require('express');
const router = express.Router();
const networkController = require('./network.controller');

/**
 * POST /api/network/follow/:userId
 * Follow a user
 * Auth required
 */
router.post('/follow/:userId', networkController.followUser);

/**
 * POST /api/network/unfollow/:userId
 * Unfollow a user
 * Auth required
 */
router.post('/unfollow/:userId', networkController.unfollowUser);

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

/**
 * GET /api/network/is-following/:userId?follower_id=xxx
 * Check if a user is following another user
 */
router.get('/is-following/:userId', networkController.isFollowing);

module.exports = router;


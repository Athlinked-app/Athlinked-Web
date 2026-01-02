const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const postsController = require('./posts.controller');
const upload = require('../utils/upload');

router.post(
  '/',
  authenticateToken,
  upload.single('media'),
  postsController.createPost
);
router.get('/', postsController.getPostsFeed);
router.get(
  '/:postId/like-status',
  authenticateToken,
  postsController.checkLikeStatus
);
router.post('/:postId/like', authenticateToken, postsController.likePost);
router.post('/:postId/unlike', authenticateToken, postsController.unlikePost);
router.post('/:postId/comments', authenticateToken, postsController.addComment);
router.get('/:postId/comments', postsController.getComments);
router.post('/:postId/save', authenticateToken, postsController.savePost);
router.delete('/:postId', authenticateToken, postsController.deletePost);
router.post(
  '/comments/:commentId/reply',
  authenticateToken,
  postsController.replyToComment
);

module.exports = router;

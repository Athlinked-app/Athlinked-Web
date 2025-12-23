const express = require('express');
const router = express.Router();
const postsController = require('./posts.controller');
const upload = require('../utils/upload');

router.post('/', upload.single('media'), postsController.createPost);
router.get('/', postsController.getPostsFeed);
router.post('/:postId/like', postsController.likePost);
router.post('/:postId/comments', postsController.addComment);
router.get('/:postId/comments', postsController.getComments);
router.post('/:postId/save', postsController.savePost);
router.delete('/:postId', postsController.deletePost);
router.post('/comments/:commentId/reply', postsController.replyToComment);

module.exports = router;


const postsService = require('./posts.service');

async function createPost(req, res) {
  try {
    const userId = req.body.user_id || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const {
      post_type,
      caption,
      article_title,
      article_body,
      event_title,
      event_date,
      event_location,
    } = req.body;

    if (!post_type || !['photo', 'video', 'article', 'event'].includes(post_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post_type. Must be photo, video, article, or event',
      });
    }

    let media_url = null;
    if (req.file) {
      media_url = `/uploads/${req.file.filename}`;
    }

    if ((post_type === 'photo' || post_type === 'video') && !media_url) {
      return res.status(400).json({
        success: false,
        message: `Media file is required for ${post_type} posts`,
      });
    }

    const postData = {
      post_type,
      caption: caption || null,
      media_url: media_url || null,
      article_title: article_title || null,
      article_body: article_body || null,
      event_title: event_title || null,
      event_date: event_date || null,
      event_location: event_location || null,
    };

    const result = await postsService.createPostService(postData, userId);
    return res.status(201).json(result);
  } catch (error) {
    console.error('Create post controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

async function getPostsFeed(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const result = await postsService.getPostsFeedService(page, limit);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get posts feed controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

async function likePost(req, res) {
  try {
    const postId = req.params.postId;
    const userId = req.body.user_id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const result = await postsService.likePostService(postId, userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Like post controller error:', error);
    if (error.message.includes('already liked')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

async function addComment(req, res) {
  try {
    const postId = req.params.postId;
    const userId = req.body.user_id || req.user?.id;
    const { comment } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required',
      });
    }

    const result = await postsService.addCommentService(postId, userId, comment.trim());
    return res.status(201).json(result);
  } catch (error) {
    console.error('Add comment controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

async function replyToComment(req, res) {
  try {
    const commentId = req.params.commentId;
    const userId = req.body.user_id || req.user?.id;
    const { comment } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reply text is required',
      });
    }

    const result = await postsService.replyToCommentService(commentId, userId, comment.trim());
    return res.status(201).json(result);
  } catch (error) {
    console.error('Reply to comment controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

async function savePost(req, res) {
  try {
    const postId = req.params.postId;
    const userId = req.body.user_id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const result = await postsService.savePostService(postId, userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Save post controller error:', error);
    if (error.message.includes('already saved')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

async function getComments(req, res) {
  try {
    const postId = req.params.postId;
    const result = await postsService.getCommentsByPostIdService(postId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get comments controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

async function deletePost(req, res) {
  try {
    const postId = req.params.postId;
    const userId = req.body.user_id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const result = await postsService.deletePostService(postId, userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Delete post controller error:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

module.exports = {
  createPost,
  getPostsFeed,
  likePost,
  addComment,
  replyToComment,
  savePost,
  getComments,
  deletePost,
};


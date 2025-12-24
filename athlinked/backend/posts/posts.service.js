const postsModel = require('./posts.model');
const pool = require('../config/db');

async function createPostService(postData, userId) {
  try {
    const userQuery = 'SELECT full_name, profile_url FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];

    const postDataWithUser = {
      ...postData,
      user_id: userId,
      username: user.full_name || 'User',
      user_profile_url: user.profile_url || null,
    };

    const createdPost = await postsModel.createPost(postDataWithUser);
    return {
      success: true,
      message: 'Post created successfully',
      post: createdPost,
    };
  } catch (error) {
    console.error('Create post service error:', error);
    throw error;
  }
}

async function getPostsFeedService(page = 1, limit = 50) {
  try {
    const posts = await postsModel.getPostsFeed(page, limit);
    return {
      success: true,
      posts,
      page,
      limit,
    };
  } catch (error) {
    console.error('Get posts feed service error:', error);
    throw error;
  }
}

async function likePostService(postId, userId) {
  const client = await pool.connect();
  try {
    const post = await postsModel.getPostById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    await client.query('BEGIN');
    try {
      const likeResult = await postsModel.likePost(postId, userId, client);
      await client.query('COMMIT');
      return {
        success: true,
        message: 'Post liked successfully',
        like_count: likeResult.like_count,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Like post service error:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function addCommentService(postId, userId, comment) {
  const client = await pool.connect();
  try {
    const post = await postsModel.getPostById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    await client.query('BEGIN');
    try {
      const commentResult = await postsModel.addComment(postId, userId, comment, client);
      await client.query('COMMIT');
      return {
        success: true,
        message: 'Comment added successfully',
        comment: commentResult.comment,
        comment_count: commentResult.comment_count,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Add comment service error:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function replyToCommentService(commentId, userId, comment) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    try {
      const replyResult = await postsModel.replyToComment(commentId, userId, comment, client);
      await client.query('COMMIT');
      return {
        success: true,
        message: 'Reply added successfully',
        comment: replyResult.comment,
        comment_count: replyResult.comment_count,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Reply to comment service error:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function savePostService(postId, userId) {
  const client = await pool.connect();
  try {
    const post = await postsModel.getPostById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    await client.query('BEGIN');
    try {
      const saveResult = await postsModel.savePost(postId, userId, client);
      await client.query('COMMIT');
      return {
        success: true,
        message: 'Post saved successfully',
        save_count: saveResult.save_count,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Save post service error:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function getCommentsByPostIdService(postId) {
  try {
    const post = await postsModel.getPostById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    const comments = await postsModel.getCommentsByPostId(postId);
    return {
      success: true,
      comments,
    };
  } catch (error) {
    console.error('Get comments service error:', error);
    throw error;
  }
}

async function deletePostService(postId, userId) {
  try {
    const post = await postsModel.getPostById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    if (post.user_id !== userId) {
      throw new Error('Unauthorized: You can only delete your own posts');
    }

    const deleted = await postsModel.deletePost(postId, userId);
    if (!deleted) {
      throw new Error('Failed to delete post');
    }

    return {
      success: true,
      message: 'Post deleted successfully',
    };
  } catch (error) {
    console.error('Delete post service error:', error);
    throw error;
  }
}

module.exports = {
  createPostService,
  getPostsFeedService,
  likePostService,
  addCommentService,
  replyToCommentService,
  savePostService,
  getCommentsByPostIdService,
  deletePostService,
};


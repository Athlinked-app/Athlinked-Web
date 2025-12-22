const clipsModel = require('./clips.model');
const pool = require('../config/db');

/**
 * Create a new clip
 * @param {object} clipData - Clip data including user_id
 * @returns {Promise<object>} Service result with created clip
 */
async function createClipService(clipData) {
  try {
    const { user_id, video_url, description } = clipData;

    if (!user_id || !video_url) {
      throw new Error('User ID and video URL are required');
    }

    // Fetch username and profile_url from users table
    const user = await clipsModel.getUserById(user_id);
    if (!user) {
      throw new Error('User not found');
    }

    // Use transaction to ensure data consistency
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const clipDataWithUser = {
        user_id,
        username: user.full_name || user.email.split('@')[0],
        user_profile_url: null, // You can add profile_url to users table later
        video_url,
        description: description || null,
      };

      const createdClip = await clipsModel.createClip(clipDataWithUser, client);

      await client.query('COMMIT');
      client.release();

      return {
        success: true,
        clip: createdClip,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      throw error;
    }
  } catch (error) {
    console.error('Create clip service error:', error.message);
    throw error;
  }
}

/**
 * Get clips feed with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<object>} Service result with clips and pagination
 */
async function getClipsFeedService(page = 1, limit = 10) {
  try {
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const result = await clipsModel.getClipsFeed(pageNum, limitNum);

    return {
      success: true,
      ...result,
    };
  } catch (error) {
    console.error('Get clips feed service error:', error.message);
    throw error;
  }
}

/**
 * Add a comment to a clip
 * @param {string} clipId - Clip UUID
 * @param {object} commentData - Comment data including user_id
 * @returns {Promise<object>} Service result with created comment
 */
async function addCommentService(clipId, commentData) {
  try {
    const { user_id, comment } = commentData;

    if (!user_id || !comment) {
      throw new Error('User ID and comment are required');
    }

    // Verify clip exists
    const clip = await clipsModel.getClipById(clipId);
    if (!clip) {
      throw new Error('Clip not found');
    }

    // Use transaction to add comment and increment count
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const newComment = await clipsModel.addComment(
        {
          clip_id: clipId,
          user_id,
          comment,
        },
        client
      );

      await clipsModel.incrementCommentCount(clipId, client);

      await client.query('COMMIT');
      client.release();

      return {
        success: true,
        comment: newComment,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      throw error;
    }
  } catch (error) {
    console.error('Add comment service error:', error.message);
    throw error;
  }
}

/**
 * Reply to a comment
 * @param {string} commentId - Parent comment UUID
 * @param {object} replyData - Reply data including user_id
 * @returns {Promise<object>} Service result with created reply
 */
async function replyToCommentService(commentId, replyData) {
  try {
    const { user_id, comment } = replyData;

    if (!user_id || !comment) {
      throw new Error('User ID and comment are required');
    }

    // Verify parent comment exists and get clip_id
    const parentComment = await clipsModel.getCommentById(commentId);
    if (!parentComment) {
      throw new Error('Parent comment not found');
    }

    const clipId = parentComment.clip_id;

    // Use transaction to add reply and increment count
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const reply = await clipsModel.addComment(
        {
          clip_id: clipId,
          user_id,
          comment,
          parent_comment_id: commentId,
        },
        client
      );

      await clipsModel.incrementCommentCount(clipId, client);

      await client.query('COMMIT');
      client.release();

      return {
        success: true,
        comment: reply,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      throw error;
    }
  } catch (error) {
    console.error('Reply to comment service error:', error.message);
    throw error;
  }
}

/**
 * Get comments for a clip
 * @param {string} clipId - Clip UUID
 * @returns {Promise<object>} Service result with comments
 */
async function getClipCommentsService(clipId) {
  try {
    // Verify clip exists
    const clip = await clipsModel.getClipById(clipId);
    if (!clip) {
      throw new Error('Clip not found');
    }

    const comments = await clipsModel.getClipComments(clipId);

    return {
      success: true,
      comments,
    };
  } catch (error) {
    console.error('Get clip comments service error:', error.message);
    throw error;
  }
}

module.exports = {
  createClipService,
  getClipsFeedService,
  addCommentService,
  replyToCommentService,
  getClipCommentsService,
};

const clipsModel = require('./clips.model');
const pool = require('../config/db');

/**
 * Create a new clip
 * @param {object} clipData - Clip data including user_id
 * @returns {Promise<object>} Service result with created clip
 */
async function createClipService(clipData) {
  let client = null;
  try {
    const { user_id, video_url, description } = clipData;

    if (!user_id || !video_url) {
      throw new Error('User ID and video URL are required');
    }

    const user = await clipsModel.getUserById(user_id);
    if (!user) {
      throw new Error('User not found');
    }

    client = await pool.connect();
    try {
      await client.query('BEGIN');

      const clipDataWithUser = {
        user_id,
        username: user.full_name || 'User',
        user_profile_url: null, // You can add profile_url to users table later
        video_url,
        description: description || null,
      };

      const createdClip = await clipsModel.createClip(clipDataWithUser, client);

      await client.query('COMMIT');

      return {
        success: true,
        clip: createdClip,
      };
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
      throw error;
    }
  } catch (error) {
    console.error('Create clip service error:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error('Error releasing database connection:', releaseError);
      }
    }
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

    const clip = await clipsModel.getClipById(clipId);
    if (!clip) {
      throw new Error('Clip not found');
    }

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

      return {
        success: true,
        comment: newComment,
      };
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
      throw error;
    }
  } catch (error) {
    console.error('Add comment service error:', error.message);
    throw error;
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error('Error releasing database connection:', releaseError);
      }
    }
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

    const parentComment = await clipsModel.getCommentById(commentId);
    if (!parentComment) {
      throw new Error('Parent comment not found');
    }

    const clipId = parentComment.clip_id;

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

      return {
        success: true,
        comment: reply,
      };
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
      throw error;
    }
  } catch (error) {
    console.error('Reply to comment service error:', error.message);
    throw error;
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error('Error releasing database connection:', releaseError);
      }
    }
  }
}

/**
 * Get comments for a clip
 * @param {string} clipId - Clip UUID
 * @returns {Promise<object>} Service result with comments
 */
async function getClipCommentsService(clipId) {
  try {
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

/**
 * Delete a clip (hard delete)
 * @param {string} clipId - Clip ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<object>} Service result
 */
async function deleteClipService(clipId, userId) {
  try {
    const clip = await clipsModel.getClipById(clipId);
    if (!clip) {
      throw new Error('Clip not found');
    }

    // Check if user is the clip owner
    if (clip.user_id === userId) {
      // User owns the clip, allow deletion
      const deleted = await clipsModel.deleteClip(clipId, userId);
      if (!deleted) {
        throw new Error('Failed to delete clip');
      }

      return {
        success: true,
        message: 'Clip deleted successfully',
      };
    }

    // Check if user is a parent of the clip author
    const signupModel = require('../signup/signup.model');
    const currentUser = await signupModel.findById(userId);
    
    if (!currentUser) {
      throw new Error('User not found');
    }

    // If current user is a parent, check if clip author is their child
    if (currentUser.user_type === 'parent' && currentUser.email) {
      const clipAuthor = await signupModel.findById(clip.user_id);
      
      if (clipAuthor && clipAuthor.parent_email && 
          clipAuthor.parent_email.toLowerCase().trim() === currentUser.email.toLowerCase().trim()) {
        // Parent is deleting their child's clip - allow it
        const deleted = await clipsModel.deleteClip(clipId, userId);
        if (!deleted) {
          throw new Error('Failed to delete clip');
        }

        return {
          success: true,
          message: 'Clip deleted successfully',
        };
      }
    }

    // User is neither the clip owner nor the parent of the clip author
    throw new Error('Unauthorized: You can only delete your own clips or clips from your athletes');
  } catch (error) {
    console.error('Delete clip service error:', error);
    throw error;
  }
}

module.exports = {
  createClipService,
  getClipsFeedService,
  addCommentService,
  replyToCommentService,
  getClipCommentsService,
  deleteClipService,
  likeClipService,
  unlikeClipService,
};

async function likeClipService(clipId, userId) {
  const client = await pool.connect();
  try {
    const clip = await clipsModel.getClipById(clipId);
    if (!clip) {
      throw new Error('Clip not found');
    }

    await client.query('BEGIN');
    try {
      const likeResult = await clipsModel.likeClip(clipId, userId, client);
      await client.query('COMMIT');
      return {
        success: true,
        message: 'Clip liked successfully',
        like_count: likeResult.like_count,
      };
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
      throw error;
    }
  } catch (error) {
    console.error('Like clip service error:', error);
    throw error;
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error('Error releasing database connection:', releaseError);
      }
    }
  }
}

async function unlikeClipService(clipId, userId) {
  const client = await pool.connect();
  try {
    const clip = await clipsModel.getClipById(clipId);
    if (!clip) {
      throw new Error('Clip not found');
    }

    await client.query('BEGIN');
    try {
      const unlikeResult = await clipsModel.unlikeClip(clipId, userId, client);
      await client.query('COMMIT');
      return {
        success: true,
        message: 'Clip unliked successfully',
        like_count: unlikeResult.like_count,
      };
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
      throw error;
    }
  } catch (error) {
    console.error('Unlike clip service error:', error);
    throw error;
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error('Error releasing database connection:', releaseError);
      }
    }
  }
}

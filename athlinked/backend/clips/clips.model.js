const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a new clip
 * @param {object} clipData - Clip data object
 * @param {object} client - Optional database client for transactions
 * @returns {Promise<object>} Created clip data
 */
async function createClip(clipData, client = null) {
  const { user_id, username, user_profile_url, video_url, description } =
    clipData;

  const id = uuidv4();
  const query = `
    INSERT INTO clips (
      id,
      user_id,
      username,
      user_profile_url,
      video_url,
      description,
      like_count,
      comment_count,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    RETURNING *
  `;

  const values = [
    id,
    user_id,
    username,
    user_profile_url,
    video_url,
    description || null,
    0, // like_count
    0, // comment_count
  ];

  try {
    const dbClient = client || pool;
    const result = await dbClient.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating clip:', error);
    throw error;
  }
}

/**
 * Get clips feed with pagination
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Number of clips per page (default: 10)
 * @returns {Promise<object>} Clips data with pagination info
 */
async function getClipsFeed(page = 1, limit = 10) {
  const offset = (page - 1) * limit;

  const query = `
    SELECT 
      id,
      user_id,
      video_url,
      description,
      like_count,
      comment_count,
      username,
      user_profile_url,
      created_at
    FROM clips
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
  `;

  const countQuery = 'SELECT COUNT(*) FROM clips';

  try {
    const [clipsResult, countResult] = await Promise.all([
      pool.query(query, [limit, offset]),
      pool.query(countQuery),
    ]);

    const totalClips = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalClips / limit);

    return {
      clips: clipsResult.rows,
      pagination: {
        page,
        limit,
        totalClips,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    console.error('Error fetching clips feed:', error);
    throw error;
  }
}

/**
 * Get clip by ID
 * @param {string} clipId - Clip UUID
 * @returns {Promise<object|null>} Clip data or null
 */
async function getClipById(clipId) {
  const query = 'SELECT * FROM clips WHERE id = $1';
  const result = await pool.query(query, [clipId]);
  return result.rows[0] || null;
}

/**
 * Add a comment to a clip
 * @param {object} commentData - Comment data object
 * @param {object} client - Optional database client for transactions
 * @returns {Promise<object>} Created comment data
 */
async function addComment(commentData, client = null) {
  const { clip_id, user_id, comment, parent_comment_id = null } = commentData;

  const id = uuidv4();
  const query = `
    INSERT INTO clip_comments (
      id,
      clip_id,
      user_id,
      comment,
      parent_comment_id,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING *
  `;

  const values = [id, clip_id, user_id, comment, parent_comment_id];

  try {
    const dbClient = client || pool;
    const result = await dbClient.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
}

/**
 * Increment comment count for a clip
 * @param {string} clipId - Clip UUID
 * @param {object} client - Optional database client for transactions
 * @returns {Promise<void>}
 */
async function incrementCommentCount(clipId, client = null) {
  const query = `
    UPDATE clips
    SET comment_count = comment_count + 1
    WHERE id = $1
  `;

  try {
    const dbClient = client || pool;
    await dbClient.query(query, [clipId]);
  } catch (error) {
    console.error('Error incrementing comment count:', error);
    throw error;
  }
}

/**
 * Get comments for a clip with nested replies
 * @param {string} clipId - Clip UUID
 * @returns {Promise<Array>} Array of comments with nested replies
 */
async function getClipComments(clipId) {
  const query = `
    SELECT 
      cc.id,
      cc.clip_id,
      cc.user_id,
      cc.comment,
      cc.parent_comment_id,
      cc.created_at,
      COALESCE(u.full_name, 'User') as username,
      u.email
    FROM clip_comments cc
    LEFT JOIN users u ON cc.user_id = u.id
    WHERE cc.clip_id = $1
    ORDER BY cc.created_at ASC
  `;

  try {
    const result = await pool.query(query, [clipId]);
    const comments = result.rows;

    const commentMap = new Map();
    const rootComments = [];

    comments.forEach(comment => {
      commentMap.set(comment.id, {
        ...comment,
        replies: [],
      });
    });

    comments.forEach(comment => {
      const commentObj = commentMap.get(comment.id);
      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies.push(commentObj);
        }
      } else {
        rootComments.push(commentObj);
      }
    });

    return rootComments;
  } catch (error) {
    console.error('Error fetching clip comments:', error);
    throw error;
  }
}

/**
 * Get user by ID (for fetching username and profile_url)
 * @param {string} userId - User UUID
 * @returns {Promise<object|null>} User data or null
 */
async function getUserById(userId) {
  const query = 'SELECT id, full_name, email FROM users WHERE id = $1';
  const result = await pool.query(query, [userId]);
  return result.rows[0] || null;
}

/**
 * Get comment by ID
 * @param {string} commentId - Comment UUID
 * @returns {Promise<object|null>} Comment data or null
 */
async function getCommentById(commentId) {
  const query = 'SELECT * FROM clip_comments WHERE id = $1';
  const result = await pool.query(query, [commentId]);
  return result.rows[0] || null;
}

/**
 * Delete a clip (hard delete)
 * @param {string} clipId - Clip ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<boolean>} True if clip was deleted, false otherwise
 */
async function deleteClip(clipId, userId) {
  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

    await dbClient.query('DELETE FROM clip_comments WHERE clip_id = $1', [clipId]);
    
    const deleteQuery = 'DELETE FROM clips WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await dbClient.query(deleteQuery, [clipId, userId]);
    
    await dbClient.query('COMMIT');
    return result.rows.length > 0;
  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error('Error deleting clip:', error);
    throw error;
  } finally {
    dbClient.release();
  }
}

module.exports = {
  createClip,
  getClipsFeed,
  getClipById,
  addComment,
  incrementCommentCount,
  getClipComments,
  getUserById,
  getCommentById,
  deleteClip,
};

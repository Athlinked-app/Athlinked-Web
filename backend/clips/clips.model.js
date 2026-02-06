const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Helper function to retry database operations
async function retryQuery(queryFn, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await queryFn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      if (err.message && err.message.includes('timeout')) {
        console.log(`Retrying query (attempt ${i + 1}/${maxRetries}) after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        throw err; // Don't retry for non-timeout errors
      }
    }
  }
}

// ... [Keep your existing table creation/ensure columns code here] ...
// (Omitting the table setup code for brevity as it remains unchanged)
// ...

/**
 * Create a new clip
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
      save_count,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
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
    0, // save_count
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
 */
async function getClipsFeed(page = 1, limit = 10, viewerUserId = null) {
  const offset = (page - 1) * limit;

  let query;
  let countQuery;
  let queryParams;
  let countParams;

  if (!viewerUserId) {
    // Unauthenticated users only see clips from featured users
    query = `
      SELECT 
        c.id,
        c.user_id,
        c.video_url,
        c.description,
        (SELECT COUNT(*)::int FROM clip_likes WHERE clip_id = c.id) as like_count,
        c.share_count,
        -- FIX: Dynamic comment count
        (SELECT COUNT(*)::int FROM clip_comments WHERE clip_id = c.id) as comment_count,
        (SELECT COUNT(*)::int FROM clip_saves WHERE clip_id = c.id) as save_count,
        c.username,
        u.profile_url as user_profile_url,
        c.created_at
      FROM clips c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE u.is_featured = true
      ORDER BY c.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    countQuery = `
      SELECT COUNT(*) 
      FROM clips c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE u.is_featured = true
    `;
    queryParams = [limit, offset];
    countParams = [];
  } else {
    // Authenticated users
    query = `
      SELECT DISTINCT
        c.id,
        c.user_id,
        c.video_url,
        c.description,
        (SELECT COUNT(*)::int FROM clip_likes WHERE clip_id = c.id) as like_count,
        c.share_count,
        -- FIX: Dynamic comment count
        (SELECT COUNT(*)::int FROM clip_comments WHERE clip_id = c.id) as comment_count,
        (SELECT COUNT(*)::int FROM clip_saves WHERE clip_id = c.id) as save_count,
        c.username,
        u.profile_url as user_profile_url,
        c.created_at,
        CASE
          WHEN cl.clip_id IS NOT NULL THEN true
          ELSE false
        END as is_liked,
        CASE 
          WHEN cs.clip_id IS NOT NULL THEN true 
          ELSE false 
        END as is_saved
      FROM clips c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN clip_likes cl ON c.id = cl.clip_id AND cl.user_id = $1
      LEFT JOIN clip_saves cs ON c.id = cs.clip_id AND cs.user_id = $1
      WHERE (
        c.user_id = $1
        OR u.is_featured = true
        OR EXISTS (
          SELECT 1 
          FROM user_follows uf 
          WHERE if.follower_id = $1 
            AND uf.following_id = c.user_id
        )
        OR EXISTS (
          SELECT 1 
          FROM user_connections uc 
          WHERE (uc.user_id_1 = $1 AND uc.user_id_2 = c.user_id)
             OR (uc.user_id_1 = c.user_id AND uc.user_id_2 = $1)
        )
      )
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    countQuery = `
      SELECT COUNT(DISTINCT c.id)
      FROM clips c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE (
        c.user_id = $1
        OR u.is_featured = true
        OR EXISTS (
          SELECT 1 
          FROM user_follows uf 
          WHERE uf.follower_id = $1 
            AND uf.following_id = c.user_id
        )
        OR EXISTS (
          SELECT 1 
          FROM user_connections uc 
          WHERE (uc.user_id_1 = $1 AND uc.user_id_2 = c.user_id)
             OR (uc.user_id_1 = c.user_id AND uc.user_id_2 = $1)
        )
      )
    `;
    queryParams = [viewerUserId, limit, offset];
    countParams = [viewerUserId];
  }

  try {
    const [clipsResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, countParams),
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
 */
async function getClipById(clipId) {
  // FIX: Dynamic counts calculation
  const query = `
    SELECT 
      c.id,
      c.user_id,
      c.video_url,
      c.description,
      (SELECT COUNT(*)::int FROM clip_likes WHERE clip_id = c.id) as like_count,
      (SELECT COUNT(*)::int FROM clip_comments WHERE clip_id = c.id) as comment_count,
      (SELECT COUNT(*)::int FROM clip_saves WHERE clip_id = c.id) as save_count,
      c.share_count,
      c.username,
      c.user_profile_url,
      c.created_at
    FROM clips c 
    WHERE c.id = $1
  `;
  const result = await pool.query(query, [clipId]);
  return result.rows[0] || null;
}

/**
 * Add a comment to a clip
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
 * Increment comment count for a clip (Kept for compatibility, though get queries use dynamic count now)
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
      u.email,
      u.profile_url as user_profile_url,
      COALESCE(parent_u.full_name, 'User') as parent_username
    FROM clip_comments cc
    LEFT JOIN users u ON cc.user_id = u.id
    LEFT JOIN clip_comments parent_cc ON cc.parent_comment_id = parent_cc.id
    LEFT JOIN users parent_u ON parent_cc.user_id = parent_u.id
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
 * Get clips by user ID
 */
async function getClipsByUserId(userId, limit = 50, viewerUserId = null) {
  // If viewerUserId is provided, include is_saved field
  const isSavedField = viewerUserId 
    ? `, CASE WHEN cs.clip_id IS NOT NULL THEN true ELSE false END as is_saved`
    : '';
  const joinClause = viewerUserId
    ? `LEFT JOIN clip_saves cs ON c.id = cs.clip_id AND cs.user_id = $3`
    : '';
  
  const query = `
    SELECT 
      c.id,
      c.user_id,
      c.video_url,
      c.description,
      (SELECT COUNT(*)::int FROM clip_likes WHERE clip_id = c.id) as like_count,
      -- FIX: Dynamic comment count
      (SELECT COUNT(*)::int FROM clip_comments WHERE clip_id = c.id) as comment_count,
      (SELECT COUNT(*)::int FROM clip_saves WHERE clip_id = c.id) as save_count,
      c.username,
      u.profile_url as user_profile_url,
      c.created_at
      ${isSavedField}
    FROM clips c
    LEFT JOIN users u ON c.user_id = u.id
    ${joinClause}
    WHERE c.user_id = $1
    ORDER BY c.created_at DESC
    LIMIT $2
  `;

  try {
    const params = viewerUserId ? [userId, limit, viewerUserId] : [userId, limit];
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error fetching user clips:', error);
    throw error;
  }
}

/**
 * Get user by ID 
 */
async function getUserById(userId) {
  const query = 'SELECT id, full_name, email FROM users WHERE id = $1';
  const result = await pool.query(query, [userId]);
  return result.rows[0] || null;
}

/**
 * Get comment by ID
 */
async function getCommentById(commentId) {
  const query = 'SELECT * FROM clip_comments WHERE id = $1';
  const result = await pool.query(query, [commentId]);
  return result.rows[0] || null;
}

/**
 * Delete a clip
 */
async function deleteClip(clipId, userId) {
  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

    await dbClient.query('DELETE FROM clip_comments WHERE clip_id = $1', [
      clipId,
    ]);

    const deleteQuery = 'DELETE FROM clips WHERE id = $1 RETURNING id';
    const result = await dbClient.query(deleteQuery, [clipId]);

    await dbClient.query('COMMIT');
    return result.rows.length > 0;
  } catch (error) {
    try {
      await dbClient.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
    console.error('Error deleting clip:', error);
    throw error;
  } finally {
    if (dbClient) {
      try {
        dbClient.release();
      } catch (releaseError) {
        console.error('Error releasing database connection:', releaseError);
      }
    }
  }
}

/**
 * Save a clip
 */
async function saveClip(clipId, userId, client = null) {
  const checkQuery =
    'SELECT * FROM clip_saves WHERE clip_id = $1 AND user_id = $2';
  const getClipAuthorQuery = 'SELECT user_id FROM clips WHERE id = $1';
  const insertSaveQuery =
    'INSERT INTO clip_saves (clip_id, user_id, clip_author_id) VALUES ($1, $2, $3)';
  const updateCountQuery =
    'UPDATE clips SET save_count = save_count + 1 WHERE id = $1 RETURNING save_count';

  try {
    const dbClient = client || pool;

    const checkResult = await dbClient.query(checkQuery, [clipId, userId]);
    if (checkResult.rows.length > 0) {
      throw new Error('Clip already saved by this user');
    }

    // Get the clip author ID
    const clipResult = await dbClient.query(getClipAuthorQuery, [clipId]);
    if (clipResult.rows.length === 0) {
      throw new Error('Clip not found');
    }
    const clipAuthorId = clipResult.rows[0].user_id;

    await dbClient.query(insertSaveQuery, [clipId, userId, clipAuthorId]);
    const updateResult = await dbClient.query(updateCountQuery, [clipId]);

    return { save_count: updateResult.rows[0].save_count };
  } catch (error) {
    console.error('Error saving clip:', error);
    throw error;
  }
}

/**
 * Unsave a clip
 */
async function unsaveClip(clipId, userId, client = null) {
  const deleteSaveQuery =
    'DELETE FROM clip_saves WHERE clip_id = $1 AND user_id = $2';
  const updateCountQuery =
    'UPDATE clips SET save_count = GREATEST(save_count - 1, 0) WHERE id = $1 RETURNING save_count';

  try {
    const dbClient = client || pool;
    await dbClient.query(deleteSaveQuery, [clipId, userId]);
    const updateResult = await dbClient.query(updateCountQuery, [clipId]);
    return { save_count: updateResult.rows[0].save_count };
  } catch (error) {
    console.error('Error unsaving clip:', error);
    throw error;
  }
}

/**
 * Check if a clip is saved by a user
 */
async function checkClipSaveStatus(clipId, userId) {
  const query = 'SELECT * FROM clip_saves WHERE clip_id = $1 AND user_id = $2';
  try {
    const result = await pool.query(query, [clipId, userId]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking clip save status:', error);
    throw error;
  }
}

/**
 * Get saved clips for a user
 */
async function getSavedClipsByUserId(userId, limit = 50) {
  const query = `
    SELECT 
      c.id,
      c.user_id,
      c.username,
      clip_author.profile_url as user_profile_url,
      c.video_url,
      c.description,
      
      -- FIX: Dynamic counts for saved clips
      (SELECT COUNT(*)::int FROM clip_likes WHERE clip_id = c.id) as like_count,
      (SELECT COUNT(*)::int FROM clip_comments WHERE clip_id = c.id) as comment_count,
      (SELECT COUNT(*)::int FROM clip_saves WHERE clip_id = c.id) as save_count,

      c.created_at,
      c.user_id as clip_author_id,
      c.username as clip_author_username,
      clip_author.profile_url as clip_author_profile_url,
      COALESCE(u.full_name, c.username) as author_name,
      u.profile_url as author_profile_url,
      u.id as author_id,
      u.username as author_username,
      u.user_type as author_type,
      cs.user_id as saved_by_user_id,
      COALESCE(cs.clip_author_id, c.user_id) as saved_clip_author_id,
      cs.created_at as saved_at
    FROM clips c
    INNER JOIN clip_saves cs ON c.id = cs.clip_id
    LEFT JOIN users clip_author ON c.user_id = clip_author.id
    LEFT JOIN users u ON COALESCE(cs.clip_author_id, c.user_id) = u.id
    WHERE cs.user_id = $1
    ORDER BY cs.created_at DESC
    LIMIT $2
  `;

  try {
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching saved clips:', error);
    throw error;
  }
}

// ... [Keep your existing like/unlike helper functions here] ...
async function checkClipLikeStatus(clipId, userId) {
  const query = 'SELECT * FROM clip_likes WHERE clip_id = $1 AND user_id = $2';
  try {
    const result = await pool.query(query, [clipId, userId]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking clip like status:', error);
    throw error;
  }
}

async function likeClip(clipId, userId, client = null) {
  const checkQuery =
    'SELECT * FROM clip_likes WHERE clip_id = $1 AND user_id = $2';
  const insertLikeQuery =
    'INSERT INTO clip_likes (clip_id, user_id) VALUES ($1, $2)';
  const getCountQuery =
    'SELECT COUNT(*)::int as like_count FROM clip_likes WHERE clip_id = $1';

  try {
    const dbClient = client || pool;
    const checkResult = await dbClient.query(checkQuery, [clipId, userId]);
    if (checkResult.rows.length > 0) {
      throw new Error('Clip already liked by this user');
    }

    await dbClient.query(insertLikeQuery, [clipId, userId]);
    const countResult = await dbClient.query(getCountQuery, [clipId]);
    return { like_count: countResult.rows[0].like_count };
  } catch (error) {
    console.error('Error liking clip:', error);
    throw error;
  }
}

async function unlikeClip(clipId, userId, client = null) {
  const deleteLikeQuery =
    'DELETE FROM clip_likes WHERE clip_id = $1 AND user_id = $2';
  const getCountQuery =
    'SELECT COUNT(*)::int as like_count FROM clip_likes WHERE clip_id = $1';

  try {
    const dbClient = client || pool;
    await dbClient.query(deleteLikeQuery, [clipId, userId]);
    const countResult = await dbClient.query(getCountQuery, [clipId]);
    return { like_count: countResult.rows[0].like_count };
  } catch (error) {
    console.error('Error unliking clip:', error);
    throw error;
  }
}

async function incrementShareCount(clipId, client = null) {
  const updateCountQuery =
    'UPDATE clips SET share_count = COALESCE(share_count, 0) + 1 WHERE id = $1 RETURNING share_count';

  try {
    const dbClient = client || pool;
    const updateResult = await dbClient.query(updateCountQuery, [clipId]);
    if (!updateResult.rows[0]) {
      throw new Error('Clip not found');
    }
    return { share_count: updateResult.rows[0].share_count };
  } catch (error) {
    console.error('Error incrementing share count:', error);
    throw error;
  }
}

module.exports = {
  createClip,
  getClipsFeed,
  getClipById,
  getClipsByUserId,
  addComment,
  incrementCommentCount,
  getClipComments,
  getUserById,
  getCommentById,
  deleteClip,
  checkClipLikeStatus,
  likeClip,
  unlikeClip,
  incrementShareCount,
  saveClip,
  unsaveClip,
  checkClipSaveStatus,
  getSavedClipsByUserId,
};
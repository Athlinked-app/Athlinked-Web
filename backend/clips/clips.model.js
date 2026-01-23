const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Ensure clip_likes table exists for persisting likes on clips
(async function ensureClipLikesTable() {
  try {
    const createQuery = `
      CREATE TABLE IF NOT EXISTS clip_likes (
        clip_id UUID NOT NULL,
        user_id UUID NOT NULL,
        PRIMARY KEY (clip_id, user_id),
        FOREIGN KEY (clip_id) REFERENCES clips(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`;
    await pool.query(createQuery);
  } catch (err) {
    console.error(
      'Error ensuring clip_likes table exists:',
      err.message || err
    );
  }
})();

// Ensure clips table has save_count column
(async function ensureClipsTableSaveCount() {
  try {
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'clips' AND column_name = 'save_count'
    `;
    const columnResult = await pool.query(checkColumnQuery);
    
    if (columnResult.rows.length === 0) {
      const addColumnQuery = `
        ALTER TABLE clips 
        ADD COLUMN save_count INTEGER DEFAULT 0
      `;
      await pool.query(addColumnQuery);
      console.log('Added save_count column to clips table');
      
      // Initialize save_count for existing clips
      const initCountQuery = `
        UPDATE clips c
        SET save_count = (
          SELECT COUNT(*) 
          FROM clip_saves cs 
          WHERE cs.clip_id = c.id
        )
      `;
      await pool.query(initCountQuery);
      console.log('Initialized save_count for existing clips');
    }
  } catch (err) {
    console.error(
      'Error ensuring clips table has save_count column:',
      err.message || err
    );
  }
})();

// Ensure clip_saves table exists for persisting saves on clips
(async function ensureClipSavesTable() {
  try {
    const createQuery = `
      CREATE TABLE IF NOT EXISTS clip_saves (
        clip_id UUID NOT NULL,
        user_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (clip_id, user_id),
        FOREIGN KEY (clip_id) REFERENCES clips(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`;
    await pool.query(createQuery);
    
    // Check if clip_author_id column exists and add it if not
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'clip_saves' AND column_name = 'clip_author_id'
    `;
    const columnResult = await pool.query(checkColumnQuery);
    
    if (columnResult.rows.length === 0) {
      // Add clip_author_id column (without constraint first)
      try {
        const addColumnQuery = `
          ALTER TABLE clip_saves 
          ADD COLUMN clip_author_id UUID
        `;
        await pool.query(addColumnQuery);
        console.log('Added clip_author_id column to clip_saves table');
      } catch (addErr) {
        // Column might already exist, ignore
        if (!addErr.message.includes('already exists')) {
          throw addErr;
        }
      }
      
      // Backfill existing records with clip author IDs
      try {
        const backfillQuery = `
          UPDATE clip_saves cs
          SET clip_author_id = c.user_id
          FROM clips c
          WHERE cs.clip_id = c.id AND cs.clip_author_id IS NULL
        `;
        await pool.query(backfillQuery);
        console.log('Backfilled clip_author_id in clip_saves table');
      } catch (backfillErr) {
        console.error('Error backfilling clip_author_id:', backfillErr.message);
      }
      
      // Add foreign key constraint if it doesn't exist
      try {
        const checkConstraintQuery = `
          SELECT constraint_name 
          FROM information_schema.table_constraints 
          WHERE table_name = 'clip_saves' 
          AND constraint_name = 'fk_clip_author'
        `;
        const constraintResult = await pool.query(checkConstraintQuery);
        
        if (constraintResult.rows.length === 0) {
          const addConstraintQuery = `
            ALTER TABLE clip_saves 
            ADD CONSTRAINT fk_clip_author 
            FOREIGN KEY (clip_author_id) REFERENCES users(id) ON DELETE CASCADE
          `;
          await pool.query(addConstraintQuery);
          console.log('Added foreign key constraint for clip_author_id');
        }
      } catch (constraintErr) {
        // Constraint might already exist, ignore
        if (!constraintErr.message.includes('already exists')) {
          console.error('Error adding foreign key constraint:', constraintErr.message);
        }
      }
    }
  } catch (err) {
    console.error(
      'Error ensuring clip_saves table exists:',
      err.message || err
    );
  }
})();

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
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Number of clips per page (default: 10)
 * @param {string} viewerUserId - Optional viewer user ID for privacy filtering
 * @returns {Promise<object>} Clips data with pagination info
 */
async function getClipsFeed(page = 1, limit = 10, viewerUserId = null) {
  const offset = (page - 1) * limit;

  // If no viewer is authenticated, only show clips from featured users
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
        c.like_count,
        c.comment_count,
        c.save_count,
        c.username,
        c.user_profile_url,
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
    // Authenticated users see:
    // - Their own clips
    // - Clips from featured users
    // - Clips from users they follow
    // - Clips from users they are connected with
    query = `
      SELECT DISTINCT
        c.id,
        c.user_id,
        c.video_url,
        c.description,
        c.like_count,
        c.comment_count,
        c.save_count,
        c.username,
        c.user_profile_url,
        c.created_at,
        CASE 
          WHEN cs.clip_id IS NOT NULL THEN true 
          ELSE false 
        END as is_saved
      FROM clips c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN clip_saves cs ON c.id = cs.clip_id AND cs.user_id = $1
      WHERE (
        -- User sees their own clips
        c.user_id = $1
        OR
        -- Clips from featured users are visible to everyone
        u.is_featured = true
        OR
        -- User follows the clip author
        EXISTS (
          SELECT 1 
          FROM user_follows uf 
          WHERE uf.follower_id = $1 
            AND uf.following_id = c.user_id
        )
        OR
        -- User is connected to the clip author
        EXISTS (
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
 * @param {string} userId - User ID
 * @param {number} limit - Limit of clips to return
 * @returns {Promise<Array>} Array of clips
 */
async function getClipsByUserId(userId, limit = 50) {
  const query = `
    SELECT 
      id,
      user_id,
      video_url,
      description,
      like_count,
      comment_count,
      save_count,
      username,
      user_profile_url,
      created_at
    FROM clips
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2
  `;

  try {
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching user clips:', error);
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

    await dbClient.query('DELETE FROM clip_comments WHERE clip_id = $1', [
      clipId,
    ]);

    // Allow deletion if user_id matches OR if the deleter is a parent of the clip author
    // The authorization check is done in the service layer, here we just delete
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
 * @param {string} clipId - Clip UUID
 * @param {string} userId - User UUID
 * @param {object} client - Optional database client for transactions
 * @returns {Promise<object>} Save result with save_count
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
 * @param {string} clipId - Clip UUID
 * @param {string} userId - User UUID
 * @param {object} client - Optional database client for transactions
 * @returns {Promise<object>} Unsave result with save_count
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
 * @param {string} clipId - Clip UUID
 * @param {string} userId - User UUID
 * @returns {Promise<boolean>} True if saved, false otherwise
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
 * @param {string} userId - User UUID
 * @param {number} limit - Limit of clips to return
 * @returns {Promise<Array>} Array of saved clips
 */
async function getSavedClipsByUserId(userId, limit = 50) {
  const query = `
    SELECT 
      c.id,
      c.user_id,
      c.username,
      c.user_profile_url,
      c.video_url,
      c.description,
      c.like_count,
      c.comment_count,
      c.created_at,
      c.user_id as clip_author_id,
      c.username as clip_author_username,
      c.user_profile_url as clip_author_profile_url,
      COALESCE(u.full_name, c.username) as author_name,
      u.profile_url as author_profile_url,
      u.id as author_id,
      u.username as author_username,
      u.user_type as author_type,
      cs.user_id as saved_by_user_id,
      COALESCE(cs.clip_author_id, c.user_id) as saved_clip_author_id,
      cs.created_at as saved_at,
      c.save_count
    FROM clips c
    INNER JOIN clip_saves cs ON c.id = cs.clip_id
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
  // Like helpers
  checkClipLikeStatus,
  likeClip,
  unlikeClip,
  // Save helpers
  saveClip,
  unsaveClip,
  checkClipSaveStatus,
  getSavedClipsByUserId,
};

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
  const updateCountQuery =
    'UPDATE clips SET like_count = like_count + 1 WHERE id = $1 RETURNING like_count';

  try {
    const dbClient = client || pool;
    const checkResult = await dbClient.query(checkQuery, [clipId, userId]);
    if (checkResult.rows.length > 0) {
      throw new Error('Clip already liked by this user');
    }

    await dbClient.query(insertLikeQuery, [clipId, userId]);
    const updateResult = await dbClient.query(updateCountQuery, [clipId]);
    return { like_count: updateResult.rows[0].like_count };
  } catch (error) {
    console.error('Error liking clip:', error);
    throw error;
  }
}

async function unlikeClip(clipId, userId, client = null) {
  const deleteLikeQuery =
    'DELETE FROM clip_likes WHERE clip_id = $1 AND user_id = $2';
  const updateCountQuery =
    'UPDATE clips SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1 RETURNING like_count';

  try {
    const dbClient = client || pool;
    await dbClient.query(deleteLikeQuery, [clipId, userId]);
    const updateResult = await dbClient.query(updateCountQuery, [clipId]);
    return { like_count: updateResult.rows[0].like_count };
  } catch (error) {
    console.error('Error unliking clip:', error);
    throw error;
  }
}

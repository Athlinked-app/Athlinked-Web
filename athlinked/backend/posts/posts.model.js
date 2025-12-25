const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function createPost(postData, client = null) {
  const {
    user_id,
    username,
    user_profile_url,
    post_type,
    caption,
    media_url,
    article_title,
    article_body,
    event_title,
    event_date,
    event_location,
  } = postData;

  const id = uuidv4();
  const query = `
    INSERT INTO posts (
      id,
      user_id,
      username,
      user_profile_url,
      post_type,
      caption,
      media_url,
      article_title,
      article_body,
      event_title,
      event_date,
      event_location,
      like_count,
      comment_count,
      save_count,
      is_active,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
    RETURNING *
  `;

  const values = [
    id,
    user_id,
    username,
    user_profile_url,
    post_type,
    caption || null,
    media_url || null,
    article_title || null,
    article_body || null,
    event_title || null,
    event_date || null,
    event_location || null,
    0,
    0,
    0,
    true,
  ];

  try {
    const dbClient = client || pool;
    const result = await dbClient.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
}

async function getPostsFeed(page = 1, limit = 50) {
  const offset = (page - 1) * limit;
  const query = `
    SELECT *
    FROM posts
    WHERE is_active = true
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
  `;

  try {
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching posts feed:', error);
    throw error;
  }
}

async function getPostById(postId) {
  const query = 'SELECT * FROM posts WHERE id = $1 AND is_active = true';
  try {
    const result = await pool.query(query, [postId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching post by id:', error);
    throw error;
  }
}

async function likePost(postId, userId, client = null) {
  const checkQuery = 'SELECT * FROM post_likes WHERE post_id = $1 AND user_id = $2';
  const insertLikeQuery = 'INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)';
  const updateCountQuery = 'UPDATE posts SET like_count = like_count + 1 WHERE id = $1 RETURNING like_count';

  try {
    const dbClient = client || pool;
    
    const checkResult = await dbClient.query(checkQuery, [postId, userId]);
    if (checkResult.rows.length > 0) {
      throw new Error('Post already liked by this user');
    }

    await dbClient.query(insertLikeQuery, [postId, userId]);
    const updateResult = await dbClient.query(updateCountQuery, [postId]);
    
    return { like_count: updateResult.rows[0].like_count };
  } catch (error) {
    console.error('Error liking post:', error);
    throw error;
  }
}

async function addComment(postId, userId, comment, client = null) {
  const id = uuidv4();
  const insertCommentQuery = `
    INSERT INTO post_comments (id, post_id, user_id, comment, created_at)
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING *
  `;
  const updateCountQuery = 'UPDATE posts SET comment_count = comment_count + 1 WHERE id = $1 RETURNING comment_count';

  try {
    const dbClient = client || pool;
    
    const commentResult = await dbClient.query(insertCommentQuery, [id, postId, userId, comment]);
    const updateResult = await dbClient.query(updateCountQuery, [postId]);
    
    return {
      comment: commentResult.rows[0],
      comment_count: updateResult.rows[0].comment_count,
    };
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
}

async function replyToComment(commentId, userId, comment, client = null) {
  const id = uuidv4();
  const getParentQuery = 'SELECT post_id FROM post_comments WHERE id = $1';
  const insertReplyQuery = `
    INSERT INTO post_comments (id, post_id, user_id, comment, parent_comment_id, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING *
  `;
  const updateCountQuery = 'UPDATE posts SET comment_count = comment_count + 1 WHERE id = $1 RETURNING comment_count';

  try {
    const dbClient = client || pool;
    
    const parentResult = await dbClient.query(getParentQuery, [commentId]);
    if (parentResult.rows.length === 0) {
      throw new Error('Parent comment not found');
    }
    
    const postId = parentResult.rows[0].post_id;
    const replyResult = await dbClient.query(insertReplyQuery, [id, postId, userId, comment, commentId]);
    const updateResult = await dbClient.query(updateCountQuery, [postId]);
    
    return {
      comment: replyResult.rows[0],
      comment_count: updateResult.rows[0].comment_count,
    };
  } catch (error) {
    console.error('Error replying to comment:', error);
    throw error;
  }
}

async function savePost(postId, userId, client = null) {
  const checkQuery = 'SELECT * FROM post_saves WHERE post_id = $1 AND user_id = $2';
  const insertSaveQuery = 'INSERT INTO post_saves (post_id, user_id) VALUES ($1, $2)';
  const updateCountQuery = 'UPDATE posts SET save_count = save_count + 1 WHERE id = $1 RETURNING save_count';

  try {
    const dbClient = client || pool;
    
    const checkResult = await dbClient.query(checkQuery, [postId, userId]);
    if (checkResult.rows.length > 0) {
      throw new Error('Post already saved by this user');
    }

    await dbClient.query(insertSaveQuery, [postId, userId]);
    const updateResult = await dbClient.query(updateCountQuery, [postId]);
    
    return { save_count: updateResult.rows[0].save_count };
  } catch (error) {
    console.error('Error saving post:', error);
    throw error;
  }
}

async function getCommentsByPostId(postId) {
  const query = `
    SELECT 
      pc.*,
      COALESCE(u.full_name, 'User') as username,
      u.profile_url as user_profile_url
    FROM post_comments pc
    LEFT JOIN users u ON pc.user_id = u.id
    WHERE pc.post_id = $1 AND pc.parent_comment_id IS NULL
    ORDER BY pc.created_at DESC
  `;

  const repliesQuery = `
    SELECT 
      pc.*,
      COALESCE(u.full_name, 'User') as username,
      u.profile_url as user_profile_url
    FROM post_comments pc
    LEFT JOIN users u ON pc.user_id = u.id
    WHERE pc.post_id = $1 AND pc.parent_comment_id = $2
    ORDER BY pc.created_at ASC
  `;

  try {
    const commentsResult = await pool.query(query, [postId]);
    const comments = commentsResult.rows;

    for (const comment of comments) {
      const repliesResult = await pool.query(repliesQuery, [postId, comment.id]);
      comment.replies = repliesResult.rows;
    }

    return comments;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
}

async function deletePost(postId, userId) {
  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

    await dbClient.query('DELETE FROM post_likes WHERE post_id = $1', [postId]);
    await dbClient.query('DELETE FROM post_comments WHERE post_id = $1', [postId]);
    await dbClient.query('DELETE FROM post_saves WHERE post_id = $1', [postId]);
    
    const deleteQuery = 'DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await dbClient.query(deleteQuery, [postId, userId]);
    
    await dbClient.query('COMMIT');
    return result.rows.length > 0;
  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error('Error deleting post:', error);
    throw error;
  } finally {
    dbClient.release();
  }
}

module.exports = {
  createPost,
  getPostsFeed,
  getPostById,
  likePost,
  addComment,
  replyToComment,
  savePost,
  getCommentsByPostId,
  deletePost,
};


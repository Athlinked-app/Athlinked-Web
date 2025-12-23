const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a new article
 * @param {object} articleData - Article data object
 * @param {object} client - Optional database client for transactions
 * @returns {Promise<object>} Created article data
 */
async function createArticle(articleData, client = null) {
  const {
    user_id,
    title,
    description,
    article_link,
  } = articleData;

  const id = uuidv4();
  const query = `
    INSERT INTO articles (
      id,
      user_id,
      title,
      description,
      article_link,
      is_active,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    RETURNING *
  `;

  const values = [
    id,
    user_id,
    title || null,
    description || null,
    article_link,
    true,
  ];

  const dbClient = client || pool;
  const result = await dbClient.query(query, values);
  return result.rows[0];
}

/**
 * Get all active articles
 * @param {object} client - Optional database client for transactions
 * @returns {Promise<Array>} Array of article data
 */
async function getAllArticles(client = null) {
  const query = `
    SELECT *
    FROM articles
    WHERE is_active = true
    ORDER BY created_at DESC
  `;

  const dbClient = client || pool;
  const result = await dbClient.query(query);
  return result.rows;
}

/**
 * Get article by ID
 * @param {string} articleId - Article ID
 * @param {object} client - Optional database client for transactions
 * @returns {Promise<object|null>} Article data or null
 */
async function getArticleById(articleId, client = null) {
  const query = `
    SELECT *
    FROM articles
    WHERE id = $1
      AND is_active = true
  `;

  const dbClient = client || pool;
  const result = await dbClient.query(query, [articleId]);
  return result.rows[0] || null;
}

/**
 * Delete an article (hard delete)
 * @param {string} articleId - Article ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<boolean>} True if article was deleted, false otherwise
 */
async function deleteArticle(articleId, userId) {
  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

    const deleteQuery = 'DELETE FROM articles WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await dbClient.query(deleteQuery, [articleId, userId]);
    
    await dbClient.query('COMMIT');
    return result.rows.length > 0;
  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error('Error deleting article:', error);
    throw error;
  } finally {
    dbClient.release();
  }
}

/**
 * Soft delete an article (set is_active = false)
 * @param {string} articleId - Article ID
 * @param {string} userId - User ID (for authorization)
 * @param {object} client - Optional database client for transactions
 * @returns {Promise<object|null>} Updated article data or null
 * @deprecated Use deleteArticle instead for hard delete
 */
async function softDeleteArticle(articleId, userId, client = null) {
  const query = `
    UPDATE articles
    SET is_active = false,
        updated_at = NOW()
    WHERE id = $1
      AND user_id = $2
      AND is_active = true
    RETURNING *
  `;

  const dbClient = client || pool;
  const result = await dbClient.query(query, [articleId, userId]);
  return result.rows[0] || null;
}

module.exports = {
  createArticle,
  getAllArticles,
  getArticleById,
  deleteArticle,
  softDeleteArticle,
};


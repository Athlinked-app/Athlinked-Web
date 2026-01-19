const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a new template
 * @param {object} templateData - Template data object
 * @param {object} client - Optional database client for transactions
 * @returns {Promise<object>} Created template data
 */
async function createTemplate(templateData, client = null) {
  const { user_id, title, description, file_url, file_type, file_size } =
    templateData;

  const id = uuidv4();
  const query = `
    INSERT INTO templates (
      id,
      user_id,
      title,
      description,
      file_url,
      file_type,
      file_size,
      is_active,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    RETURNING *
  `;

  const values = [
    id,
    user_id,
    title || null,
    description || null,
    file_url,
    file_type || null,
    file_size || null,
    true, // is_active defaults to true
  ];

  const dbClient = client || pool;
  const result = await dbClient.query(query, values);
  return result.rows[0];
}

/**
 * Get all active templates
 * @param {string} userId - Optional user ID to filter by
 * @param {object} client - Optional database client for transactions
 * @returns {Promise<Array>} Array of template data
 */
async function getAllTemplates(userId = null, client = null) {
  let query = `
    SELECT *
    FROM templates
    WHERE is_active = true
  `;
  const values = [];

  if (userId) {
    query += ` AND user_id = $1`;
    values.push(userId);
  }

  query += ` ORDER BY created_at DESC`;

  const dbClient = client || pool;
  const result = await dbClient.query(query, values);
  return result.rows;
}

/**
 * Get template by ID
 * @param {string} templateId - Template ID
 * @param {object} client - Optional database client for transactions
 * @returns {Promise<object|null>} Template data or null
 */
async function getTemplateById(templateId, client = null) {
  const query = `
    SELECT *
    FROM templates
    WHERE id = $1
      AND is_active = true
  `;

  const dbClient = client || pool;
  const result = await dbClient.query(query, [templateId]);
  return result.rows[0] || null;
}

/**
 * Delete a template (hard delete)
 * @param {string} templateId - Template ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<boolean>} True if template was deleted, false otherwise
 */
async function deleteTemplate(templateId, userId) {
  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

    const deleteQuery =
      'DELETE FROM templates WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await dbClient.query(deleteQuery, [templateId, userId]);

    await dbClient.query('COMMIT');
    return result.rows.length > 0;
  } catch (error) {
    try {
      await dbClient.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
    console.error('Error deleting template:', error);
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
 * Soft delete a template (set is_active = false)
 * @param {string} templateId - Template ID
 * @param {string} userId - User ID (for authorization)
 * @param {object} client - Optional database client for transactions
 * @returns {Promise<object|null>} Updated template data or null
 * @deprecated Use deleteTemplate instead for hard delete
 */
async function softDeleteTemplate(templateId, userId, client = null) {
  const query = `
    UPDATE templates
    SET is_active = false,
        updated_at = NOW()
    WHERE id = $1
      AND user_id = $2
      AND is_active = true
    RETURNING *
  `;

  const dbClient = client || pool;
  const result = await dbClient.query(query, [templateId, userId]);
  return result.rows[0] || null;
}

module.exports = {
  createTemplate,
  getAllTemplates,
  getTemplateById,
  deleteTemplate,
  softDeleteTemplate,
};

const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a new resource
 * @param {object} resourceData - Resource data object
 * @param {object} client - Optional database client for transactions
 * @returns {Promise<object>} Created resource data
 */
async function createResource(resourceData, client = null) {
  const {
    user_id,
    resource_type,
    title,
    description,
    article_link,
    video_url,
    video_duration,
    file_url,
    file_type,
    file_size,
  } = resourceData;

  const id = uuidv4();
  const query = `
    INSERT INTO resources (
      id,
      user_id,
      resource_type,
      title,
      description,
      article_link,
      video_url,
      video_duration,
      file_url,
      file_type,
      file_size,
      is_active,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
    RETURNING *
  `;

  // Only set fields that are provided (not undefined) to allow for combined rows
  const values = [
    id,
    user_id,
    resource_type,
    title || null,
    description || null,
    article_link !== undefined ? article_link : null,
    video_url !== undefined ? video_url : null,
    video_duration !== undefined ? video_duration : null,
    file_url !== undefined ? file_url : null,
    file_type !== undefined ? file_type : null,
    file_size !== undefined ? file_size : null,
    true, // is_active defaults to true
  ];

  const dbClient = client || pool;
  const result = await dbClient.query(query, values);
  return result.rows[0];
}

/**
 * Get all active resources
 * @param {object} client - Optional database client for transactions
 * @returns {Promise<Array>} Array of resource data
 */
async function getAllResources(client = null) {
  const query = `
    SELECT *
    FROM resources
    WHERE is_active = true
    ORDER BY created_at DESC
  `;

  const dbClient = client || pool;
  const result = await dbClient.query(query);
  return result.rows;
}

/**
 * Get resources by type
 * Includes combined first row if it contains data for the requested type
 * @param {string} resourceType - Resource type (article, video, template)
 * @param {object} client - Optional database client for transactions
 * @returns {Promise<Array>} Array of resource data
 */
async function getResourcesByType(resourceType, client = null) {
  let query;
  let values;

  if (resourceType === 'article') {
    // Get resources where resource_type is 'article' OR where article_link is not null
    query = `
      SELECT *
      FROM resources
      WHERE is_active = true
        AND (
          resource_type = $1
          OR article_link IS NOT NULL
        )
      ORDER BY created_at DESC
    `;
    values = [resourceType];
  } else if (resourceType === 'video') {
    // Get resources where resource_type is 'video' OR where video_url is not null
    query = `
      SELECT *
      FROM resources
      WHERE is_active = true
        AND (
          resource_type = $1
          OR video_url IS NOT NULL
        )
      ORDER BY created_at DESC
    `;
    values = [resourceType];
  } else if (resourceType === 'template') {
    // Get resources where resource_type is 'template' OR where file_url is not null
    query = `
      SELECT *
      FROM resources
      WHERE is_active = true
        AND (
          resource_type = $1
          OR file_url IS NOT NULL
        )
      ORDER BY created_at DESC
    `;
    values = [resourceType];
  } else {
    // Fallback to original query
    query = `
      SELECT *
      FROM resources
      WHERE is_active = true
        AND resource_type = $1
      ORDER BY created_at DESC
    `;
    values = [resourceType];
  }

  const dbClient = client || pool;
  const result = await dbClient.query(query, values);
  return result.rows;
}

/**
 * Soft delete a resource (set is_active = false)
 * @param {string} resourceId - Resource ID
 * @param {string} userId - User ID (for authorization)
 * @param {object} client - Optional database client for transactions
 * @returns {Promise<object|null>} Updated resource data or null
 */
async function softDeleteResource(resourceId, userId, client = null) {
  const query = `
    UPDATE resources
    SET is_active = false,
        updated_at = NOW()
    WHERE id = $1
      AND user_id = $2
      AND is_active = true
    RETURNING *
  `;

  const dbClient = client || pool;
  const result = await dbClient.query(query, [resourceId, userId]);
  return result.rows[0] || null;
}

/**
 * Get resource by ID
 * @param {string} resourceId - Resource ID
 * @param {object} client - Optional database client for transactions
 * @returns {Promise<object|null>} Resource data or null
 */
async function getResourceById(resourceId, client = null) {
  const query = `
    SELECT *
    FROM resources
    WHERE id = $1
      AND is_active = true
  `;

  const dbClient = client || pool;
  const result = await dbClient.query(query, [resourceId]);
  return result.rows[0] || null;
}

/**
 * Get user's first resource (combined row for first article, video, template)
 * @param {string} userId - User ID
 * @param {object} client - Optional database client for transactions
 * @returns {Promise<object|null>} First resource data or null
 */
async function getUserFirstResource(userId, client = null) {
  const query = `
    SELECT *
    FROM resources
    WHERE user_id = $1
      AND is_active = true
    ORDER BY created_at ASC
    LIMIT 1
  `;

  const dbClient = client || pool;
  const result = await dbClient.query(query, [userId]);
  return result.rows[0] || null;
}

/**
 * Check if user has any resources of a specific type
 * This checks both the resource_type column AND the actual data fields
 * (e.g., video_url for videos, article_link for articles, file_url for templates)
 * @param {string} userId - User ID
 * @param {string} resourceType - Resource type (article, video, template)
 * @param {object} client - Optional database client for transactions
 * @returns {Promise<boolean>} True if user has resources of this type
 */
async function userHasResourceType(userId, resourceType, client = null) {
  let query;

  if (resourceType === 'article') {
    // Check if user has any resources with article_link
    query = `
      SELECT COUNT(*) as count
      FROM resources
      WHERE user_id = $1
        AND article_link IS NOT NULL
        AND is_active = true
    `;
  } else if (resourceType === 'video') {
    // Check if user has any resources with video_url
    query = `
      SELECT COUNT(*) as count
      FROM resources
      WHERE user_id = $1
        AND video_url IS NOT NULL
        AND is_active = true
    `;
  } else if (resourceType === 'template') {
    // Check if user has any resources with file_url
    query = `
      SELECT COUNT(*) as count
      FROM resources
      WHERE user_id = $1
        AND file_url IS NOT NULL
        AND is_active = true
    `;
  } else {
    // Fallback to original check
    query = `
      SELECT COUNT(*) as count
      FROM resources
      WHERE user_id = $1
        AND resource_type = $2
        AND is_active = true
    `;
  }

  const dbClient = client || pool;
  const values =
    resourceType === 'article' ||
    resourceType === 'video' ||
    resourceType === 'template'
      ? [userId]
      : [userId, resourceType];
  const result = await dbClient.query(query, values);
  return parseInt(result.rows[0].count) > 0;
}

/**
 * Update an existing resource with new data (for combining first items)
 * @param {string} resourceId - Resource ID
 * @param {object} updateData - Data to update
 * @param {object} client - Optional database client for transactions
 * @returns {Promise<object>} Updated resource data
 */
async function updateResource(resourceId, updateData, client = null) {
  const {
    resource_type,
    title,
    description,
    article_link,
    video_url,
    video_duration,
    file_url,
    file_type,
    file_size,
  } = updateData;

  // Build dynamic update query
  const updates = [];
  const values = [];
  let paramIndex = 1;

  if (resource_type !== undefined) {
    updates.push(`resource_type = $${paramIndex++}`);
    values.push(resource_type);
  }
  if (title !== undefined) {
    updates.push(`title = $${paramIndex++}`);
    values.push(title);
  }
  if (description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(description);
  }
  // Only update fields that are explicitly provided (not undefined)
  // This ensures we don't accidentally set fields to null when they shouldn't be
  if (article_link !== undefined) {
    updates.push(`article_link = $${paramIndex++}`);
    values.push(article_link);
  }
  if (video_url !== undefined) {
    updates.push(`video_url = $${paramIndex++}`);
    values.push(video_url);
  }
  if (video_duration !== undefined) {
    updates.push(`video_duration = $${paramIndex++}`);
    values.push(video_duration);
  }
  if (file_url !== undefined) {
    updates.push(`file_url = $${paramIndex++}`);
    values.push(file_url);
  }
  if (file_type !== undefined) {
    updates.push(`file_type = $${paramIndex++}`);
    values.push(file_type);
  }
  if (file_size !== undefined) {
    updates.push(`file_size = $${paramIndex++}`);
    values.push(file_size);
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  updates.push(`updated_at = NOW()`);
  values.push(resourceId);

  const query = `
    UPDATE resources
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
      AND is_active = true
    RETURNING *
  `;

  const dbClient = client || pool;
  const result = await dbClient.query(query, values);
  return result.rows[0];
}

module.exports = {
  createResource,
  getAllResources,
  getResourcesByType,
  softDeleteResource,
  getResourceById,
  getUserFirstResource,
  userHasResourceType,
  updateResource,
};

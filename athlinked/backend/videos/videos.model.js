const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a new video
 * @param {object} videoData - Video data object
 * @param {object} client - Optional database client for transactions
 * @returns {Promise<object>} Created video data
 */
async function createVideo(videoData, client = null) {
  const {
    user_id,
    title,
    description,
    video_url,
    video_duration,
  } = videoData;

  const id = uuidv4();
  const query = `
    INSERT INTO videos (
      id,
      user_id,
      title,
      description,
      video_url,
      video_duration,
      is_active,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    RETURNING *
  `;

  const values = [
    id,
    user_id,
    title || null,
    description || null,
    video_url,
    video_duration || null,
    true, // is_active defaults to true
  ];

  const dbClient = client || pool;
  const result = await dbClient.query(query, values);
  return result.rows[0];
}

/**
 * Get all active videos
 * @param {object} client - Optional database client for transactions
 * @returns {Promise<Array>} Array of video data
 */
async function getAllVideos(client = null) {
  const query = `
    SELECT *
    FROM videos
    WHERE is_active = true
    ORDER BY created_at DESC
  `;

  const dbClient = client || pool;
  const result = await dbClient.query(query);
  return result.rows;
}

/**
 * Get video by ID
 * @param {string} videoId - Video ID
 * @param {object} client - Optional database client for transactions
 * @returns {Promise<object|null>} Video data or null
 */
async function getVideoById(videoId, client = null) {
  const query = `
    SELECT *
    FROM videos
    WHERE id = $1
      AND is_active = true
  `;

  const dbClient = client || pool;
  const result = await dbClient.query(query, [videoId]);
  return result.rows[0] || null;
}

/**
 * Delete a video (hard delete)
 * @param {string} videoId - Video ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<boolean>} True if video was deleted, false otherwise
 */
async function deleteVideo(videoId, userId) {
  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

    const deleteQuery = 'DELETE FROM videos WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await dbClient.query(deleteQuery, [videoId, userId]);
    
    await dbClient.query('COMMIT');
    return result.rows.length > 0;
  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error('Error deleting video:', error);
    throw error;
  } finally {
    dbClient.release();
  }
}

/**
 * Soft delete a video (set is_active = false)
 * @param {string} videoId - Video ID
 * @param {string} userId - User ID (for authorization)
 * @param {object} client - Optional database client for transactions
 * @returns {Promise<object|null>} Updated video data or null
 * @deprecated Use deleteVideo instead for hard delete
 */
async function softDeleteVideo(videoId, userId, client = null) {
  const query = `
    UPDATE videos
    SET is_active = false,
        updated_at = NOW()
    WHERE id = $1
      AND user_id = $2
      AND is_active = true
    RETURNING *
  `;

  const dbClient = client || pool;
  const result = await dbClient.query(query, [videoId, userId]);
  return result.rows[0] || null;
}

module.exports = {
  createVideo,
  getAllVideos,
  getVideoById,
  deleteVideo,
  softDeleteVideo,
};


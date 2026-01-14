const pool = require('../config/db');

/**
 * Get all video and media data for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of video and media data
 */
async function getVideoMediaByUserId(userId) {
  const query = `
    SELECT 
      id,
      user_id,
      highlight_video_link,
      video_status,
      verified_media_profile,
      created_at,
      updated_at
    FROM video_media
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;

  try {
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching video and media:', error);
    throw error;
  }
}

/**
 * Create a new video and media entry
 * @param {string} userId - User ID
 * @param {object} data - Video and media data
 * @returns {Promise<object>} Created video and media entry
 */
async function createVideoMedia(userId, data) {
  const query = `
    INSERT INTO video_media (
      user_id,
      highlight_video_link,
      video_status,
      verified_media_profile
    ) VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  const values = [
    userId,
    data.highlightVideoLink || null,
    data.videoStatus || null,
    data.verifiedMediaProfile || null,
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating video and media:', error);
    throw error;
  }
}

/**
 * Update a video and media entry
 * @param {string} id - Video and media ID
 * @param {object} data - Video and media data
 * @returns {Promise<object>} Updated video and media entry
 */
async function updateVideoMedia(id, data) {
  const updateFields = [];
  const values = [];
  let paramIndex = 1;

  if (data.highlightVideoLink !== undefined) {
    updateFields.push(`highlight_video_link = $${paramIndex++}`);
    values.push(data.highlightVideoLink || null);
  }
  if (data.videoStatus !== undefined) {
    updateFields.push(`video_status = $${paramIndex++}`);
    values.push(data.videoStatus || null);
  }
  if (data.verifiedMediaProfile !== undefined) {
    updateFields.push(`verified_media_profile = $${paramIndex++}`);
    values.push(data.verifiedMediaProfile || null);
  }

  if (updateFields.length === 0) {
    throw new Error('No fields to update');
  }

  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const query = `
    UPDATE video_media
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Video and media entry not found');
    }
    return result.rows[0];
  } catch (error) {
    console.error('Error updating video and media:', error);
    throw error;
  }
}

/**
 * Delete a video and media entry
 * @param {string} id - Video and media ID
 * @returns {Promise<boolean>} True if deleted successfully
 */
async function deleteVideoMedia(id) {
  const query = `
    DELETE FROM video_media
    WHERE id = $1
    RETURNING id
  `;

  try {
    const result = await pool.query(query, [id]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error deleting video and media:', error);
    throw error;
  }
}

module.exports = {
  getVideoMediaByUserId,
  createVideoMedia,
  updateVideoMedia,
  deleteVideoMedia,
};

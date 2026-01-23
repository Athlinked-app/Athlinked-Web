const postsService = require('../posts/posts.service');
const clipsService = require('../clips/clips.service');

/**
 * Unified save service - saves posts or clips
 * @param {string} type - 'post' or 'clip'
 * @param {string} id - Post ID or Clip ID
 * @param {string} userId - User ID
 * @returns {Promise<object>} Service result
 */
async function saveItemService(type, id, userId) {
  try {
    if (type === 'post') {
      return await postsService.savePostService(id, userId);
    } else if (type === 'clip') {
      return await clipsService.saveClipService(id, userId);
    } else {
      throw new Error('Invalid type. Type must be "post" or "clip"');
    }
  } catch (error) {
    console.error('Save item service error:', error);
    throw error;
  }
}

/**
 * Unified unsave service - unsaves posts or clips
 * @param {string} type - 'post' or 'clip'
 * @param {string} id - Post ID or Clip ID
 * @param {string} userId - User ID
 * @returns {Promise<object>} Service result
 */
async function unsaveItemService(type, id, userId) {
  try {
    if (type === 'post') {
      return await postsService.unsavePostService(id, userId);
    } else if (type === 'clip') {
      return await clipsService.unsaveClipService(id, userId);
    } else {
      throw new Error('Invalid type. Type must be "post" or "clip"');
    }
  } catch (error) {
    console.error('Unsave item service error:', error);
    throw error;
  }
}

/**
 * Get all saved items (posts and clips) for a user
 * @param {string} userId - User ID
 * @param {number} limit - Limit of items to return
 * @returns {Promise<object>} Service result with posts and clips
 */
async function getSavedItemsService(userId, limit = 50) {
  try {
    // Use service functions which handle presigned URL conversion
    const [savedPostsResult, savedClipsResult] = await Promise.all([
      postsService.getSavedPostsService(userId, limit),
      clipsService.getSavedClipsService(userId, limit),
    ]);

    return {
      success: true,
      posts: savedPostsResult.posts || [],
      clips: savedClipsResult.clips || [],
    };
  } catch (error) {
    console.error('Get saved items service error:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

module.exports = {
  saveItemService,
  unsaveItemService,
  getSavedItemsService,
};

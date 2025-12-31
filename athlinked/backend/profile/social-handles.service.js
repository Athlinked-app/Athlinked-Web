const {
  getSocialHandlesByUserId,
  createSocialHandle,
  updateSocialHandle,
  deleteSocialHandle,
} = require('./social-handles.model');

/**
 * Get social handles service
 * @param {string} userId - User ID
 * @returns {Promise<object>} Social handles response
 */
async function getSocialHandlesService(userId) {
  try {
    const handles = await getSocialHandlesByUserId(userId);
    return {
      success: true,
      data: handles,
    };
  } catch (error) {
    console.error('Error in getSocialHandlesService:', error);
    throw error;
  }
}

/**
 * Create social handle service
 * @param {string} userId - User ID
 * @param {string} platform - Platform name
 * @param {string} url - Social handle URL
 * @returns {Promise<object>} Created social handle response
 */
async function createSocialHandleService(userId, platform, url) {
  try {
    if (!platform || !url) {
      throw new Error('Platform and URL are required');
    }

    const handle = await createSocialHandle(userId, platform, url);
    return {
      success: true,
      message: 'Social handle created successfully',
      data: handle,
    };
  } catch (error) {
    console.error('Error in createSocialHandleService:', error);
    throw error;
  }
}

/**
 * Update social handle service
 * @param {string} id - Social handle ID
 * @param {string} platform - Platform name
 * @param {string} url - Social handle URL
 * @returns {Promise<object>} Updated social handle response
 */
async function updateSocialHandleService(id, platform, url) {
  try {
    if (!platform || !url) {
      throw new Error('Platform and URL are required');
    }

    const handle = await updateSocialHandle(id, platform, url);
    return {
      success: true,
      message: 'Social handle updated successfully',
      data: handle,
    };
  } catch (error) {
    console.error('Error in updateSocialHandleService:', error);
    throw error;
  }
}

/**
 * Delete social handle service
 * @param {string} id - Social handle ID
 * @returns {Promise<object>} Deletion response
 */
async function deleteSocialHandleService(id) {
  try {
    const deleted = await deleteSocialHandle(id);
    if (!deleted) {
      throw new Error('Social handle not found');
    }
    return {
      success: true,
      message: 'Social handle deleted successfully',
    };
  } catch (error) {
    console.error('Error in deleteSocialHandleService:', error);
    throw error;
  }
}

module.exports = {
  getSocialHandlesService,
  createSocialHandleService,
  updateSocialHandleService,
  deleteSocialHandleService,
};

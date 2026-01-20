const searchModel = require('./search.model');
const { convertKeyToPresignedUrl } = require('../utils/s3');

/**
 * Service to search and filter users
 * @param {object} filters - Search filters
 * @returns {Promise<object>} Result object with users
 */
async function searchUsersService(filters) {
  try {
    const users = await searchModel.searchUsers(filters);

    // Convert profile URLs to presigned URLs
    const usersWithPresignedUrls = await Promise.all(
      users.map(async (user) => ({
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        email: user.email,
        user_type: user.user_type,
        profile_url: user.profile_url ? await convertKeyToPresignedUrl(user.profile_url) : null,
        bio: user.bio,
        city: user.city,
        education: user.education,
        primary_sport: user.primary_sport,
        sports_played: user.sports_played,
        dob: user.dob,
        created_at: user.created_at,
        updated_at: user.updated_at,
      }))
    );

    return {
      success: true,
      users: usersWithPresignedUrls,
      count: users.length,
    };
  } catch (error) {
    console.error('Search users service error:', error);
    throw error;
  }
}

/**
 * Service to get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<object>} Result object with user
 */
async function getUserByIdService(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const user = await searchModel.getUserById(userId);

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    // Convert profile URL to presigned URL
    const profileUrl = user.profile_url 
      ? await convertKeyToPresignedUrl(user.profile_url) 
      : null;

    return {
      success: true,
      user: {
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        email: user.email,
        user_type: user.user_type,
        profile_url: profileUrl,
        bio: user.bio,
        city: user.city,
        education: user.education,
        primary_sport: user.primary_sport,
        sports_played: user.sports_played,
        dob: user.dob,
        created_at: user.created_at,
      },
    };
  } catch (error) {
    console.error('Get user by ID service error:', error);
    throw error;
  }
}

/**
 * Service to get all users
 * @param {number} limit - Optional limit
 * @param {string} sortBy - Optional sort parameter
 * @param {string} searchType - Optional user type filter
 * @param {string} collegeSchool - Optional college/school filter
 * @returns {Promise<object>} Result object with users
 */
async function getAllUsersService(
  limit = 100,
  sortBy = '',
  searchType = '',
  collegeSchool = ''
) {
  try {
    const users = await searchModel.getAllUsers(
      limit,
      sortBy,
      searchType,
      collegeSchool
    );

    // Convert profile URLs to presigned URLs
    const usersWithPresignedUrls = await Promise.all(
      users.map(async (user) => ({
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        email: user.email,
        user_type: user.user_type,
        profile_url: user.profile_url ? await convertKeyToPresignedUrl(user.profile_url) : null,
        bio: user.bio,
        city: user.city,
        education: user.education,
        primary_sport: user.primary_sport,
        sports_played: user.sports_played,
        dob: user.dob,
        created_at: user.created_at,
      }))
    );

    return {
      success: true,
      users: usersWithPresignedUrls,
      count: users.length,
    };
  } catch (error) {
    console.error('Get all users service error:', error);
    throw error;
  }
}

module.exports = {
  searchUsersService,
  getUserByIdService,
  getAllUsersService,
};

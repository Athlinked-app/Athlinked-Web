const favoritesModel = require('./favorites.model');
const { convertKeyToPresignedUrl } = require('../utils/s3');

/**
 * Service to add an athlete to coach's favorites
 * @param {string} coachId - Coach user ID
 * @param {string} athleteId - Athlete user ID
 * @returns {Promise<object>} Result object
 */
async function addFavoriteService(coachId, athleteId) {
  try {
    if (!coachId || !athleteId) {
      throw new Error('Coach ID and Athlete ID are required');
    }

    const added = await favoritesModel.addFavorite(coachId, athleteId);

    if (!added) {
      return {
        success: false,
        message: 'Athlete is already in favorites',
        isFavorite: true,
      };
    }

    return {
      success: true,
      message: 'Athlete added to favorites successfully',
      isFavorite: true,
    };
  } catch (error) {
    console.error('Add favorite service error:', error);
    throw error;
  }
}

/**
 * Service to remove an athlete from coach's favorites
 * @param {string} coachId - Coach user ID
 * @param {string} athleteId - Athlete user ID
 * @returns {Promise<object>} Result object
 */
async function removeFavoriteService(coachId, athleteId) {
  try {
    if (!coachId || !athleteId) {
      throw new Error('Coach ID and Athlete ID are required');
    }

    const removed = await favoritesModel.removeFavorite(coachId, athleteId);

    if (!removed) {
      return {
        success: false,
        message: 'Athlete is not in favorites',
        isFavorite: false,
      };
    }

    return {
      success: true,
      message: 'Athlete removed from favorites successfully',
      isFavorite: false,
    };
  } catch (error) {
    console.error('Remove favorite service error:', error);
    throw error;
  }
}

/**
 * Service to check if athlete is in coach's favorites
 * @param {string} coachId - Coach user ID
 * @param {string} athleteId - Athlete user ID
 * @returns {Promise<object>} Result object
 */
async function checkFavoriteStatusService(coachId, athleteId) {
  try {
    if (!coachId || !athleteId) {
      throw new Error('Coach ID and Athlete ID are required');
    }

    const isFavorite = await favoritesModel.isFavorite(coachId, athleteId);

    return {
      success: true,
      isFavorite,
    };
  } catch (error) {
    console.error('Check favorite status service error:', error);
    throw error;
  }
}

/**
 * Service to get all favorites for a coach
 * @param {string} coachId - Coach user ID
 * @returns {Promise<object>} Result object with favorites list
 */
async function getFavoritesService(coachId) {
  try {
    if (!coachId) {
      throw new Error('Coach ID is required');
    }

    const favorites = await favoritesModel.getFavorites(coachId);

    // Convert profile URLs to presigned URLs
    const favoritesWithPresignedUrls = await Promise.all(
      favorites.map(async (fav) => ({
        id: fav.id,
        username: fav.username,
        full_name: fav.full_name,
        user_type: fav.user_type,
        profile_url: fav.profile_url ? await convertKeyToPresignedUrl(fav.profile_url) : null,
        bio: fav.bio,
        primary_sport: fav.primary_sport,
        sports_played: fav.sports_played,
        city: fav.city,
        education: fav.education,
        favorited_at: fav.favorited_at,
      }))
    );

    return {
      success: true,
      favorites: favoritesWithPresignedUrls,
    };
  } catch (error) {
    console.error('Get favorites service error:', error);
    throw error;
  }
}

module.exports = {
  addFavoriteService,
  removeFavoriteService,
  checkFavoriteStatusService,
  getFavoritesService,
};

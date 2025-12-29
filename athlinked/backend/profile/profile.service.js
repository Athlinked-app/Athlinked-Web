const profileModel = require('./profile.model');

/**
 * Get user profile service
 * @param {string} userId - User ID
 * @returns {Promise<object>} Profile data formatted for API response
 */
async function getUserProfileService(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const profile = await profileModel.getUserProfile(userId);

    // If profile doesn't exist, return default/empty values
    if (!profile) {
      return {
        userId,
        fullName: null,
        profileImage: null,
        coverImage: null,
        bio: null,
        education: null,
        city: null,
        primarySport: null,
        sportsPlayed: null,
      };
    }

    // Format sports_played array from users table
    let sportsPlayed = null;
    if (profile.sports_played) {
      if (Array.isArray(profile.sports_played)) {
        sportsPlayed = profile.sports_played.join(', ');
      } else if (typeof profile.sports_played === 'string') {
        // Handle PostgreSQL array format: "{Basketball, Football}" or '{"Basketball", "Football"}' -> "Basketball, Football"
        let sportsString = profile.sports_played;
        // Remove curly brackets if present
        if (sportsString.startsWith('{') && sportsString.endsWith('}')) {
          sportsString = sportsString.slice(1, -1);
        }
        // Remove quotes (both single and double) from each sport
        sportsString = sportsString.replace(/["']/g, '');
        sportsPlayed = sportsString;
      }
    }

    return {
      userId: profile.user_id,
      fullName: profile.full_name || null,
      profileImage: profile.profile_image_url || null,
      coverImage: profile.cover_image_url || null,
      bio: profile.bio || null,
      education: profile.education || null,
      city: profile.city || null,
      primarySport: profile.primary_sport || null,
      sportsPlayed: sportsPlayed,
    };
  } catch (error) {
    console.error('Get user profile service error:', error.message);
    throw error;
  }
}

/**
 * Create or update user profile service
 * @param {string} userId - User ID
 * @param {object} profileData - Profile data
 * @returns {Promise<object>} Service result
 */
async function upsertUserProfileService(userId, profileData) {
  try {
    console.log('=== SERVICE: upsertUserProfileService ===');
    console.log('UserId:', userId);
    console.log('ProfileData:', JSON.stringify(profileData, null, 2));
    
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!profileData || Object.keys(profileData).length === 0) {
      console.log('WARNING: No profile data provided');
    }

    const updatedProfile = await profileModel.upsertUserProfile(userId, profileData);

    console.log('Service: Profile updated successfully');
    return {
      success: true,
      message: 'Profile saved successfully',
      profile: {
        userId: updatedProfile.user_id,
        profileImage: updatedProfile.profile_image_url,
        coverImage: updatedProfile.cover_image_url,
        bio: updatedProfile.bio,
        education: updatedProfile.education,
        primarySport: updatedProfile.primary_sport,
      },
    };
  } catch (error) {
    console.error('=== SERVICE ERROR: upsertUserProfileService ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

/**
 * Update profile images only service
 * @param {string} userId - User ID
 * @param {object} imageData - Image URLs
 * @returns {Promise<object>} Service result
 */
async function updateProfileImagesService(userId, imageData) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const updatedProfile = await profileModel.updateProfileImages(userId, imageData);

    return {
      success: true,
      message: 'Profile images updated successfully',
      profile: {
        userId: updatedProfile.user_id,
        profileImage: updatedProfile.profile_image_url,
        coverImage: updatedProfile.cover_image_url,
      },
    };
  } catch (error) {
    console.error('Update profile images service error:', error.message);
    throw error;
  }
}

module.exports = {
  getUserProfileService,
  upsertUserProfileService,
  updateProfileImagesService,
};


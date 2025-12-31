const profileModel = require('./profile.model');

async function getUserProfileService(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const profile = await profileModel.getUserProfile(userId);

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
        dob: null,
      };
    }

    let sportsPlayed = null;
    if (profile.sports_played) {
      if (Array.isArray(profile.sports_played)) {
        sportsPlayed = profile.sports_played.join(', ');
      } else if (typeof profile.sports_played === 'string') {
        let sportsString = profile.sports_played;
        if (sportsString.startsWith('{') && sportsString.endsWith('}')) {
          sportsString = sportsString.slice(1, -1);
        }
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
      dob: profile.dob || null,
    };
  } catch (error) {
    console.error('Get user profile service error:', error.message);
    throw error;
  }
}

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

    const updatedProfile = await profileModel.upsertUserProfile(
      userId,
      profileData
    );

    let sportsPlayed = null;
    if (updatedProfile.sports_played) {
      if (Array.isArray(updatedProfile.sports_played)) {
        sportsPlayed = updatedProfile.sports_played.join(', ');
      } else if (typeof updatedProfile.sports_played === 'string') {
        let sportsString = updatedProfile.sports_played;
        if (sportsString.startsWith('{') && sportsString.endsWith('}')) {
          sportsString = sportsString.slice(1, -1);
        }
        sportsString = sportsString.replace(/["']/g, '');
        sportsPlayed = sportsString;
      }
    }

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
        city: updatedProfile.city,
        primarySport: updatedProfile.primary_sport,
        sportsPlayed: sportsPlayed,
      },
    };
  } catch (error) {
    console.error('=== SERVICE ERROR: upsertUserProfileService ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

async function updateProfileImagesService(userId, imageData) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const updatedProfile = await profileModel.updateProfileImages(
      userId,
      imageData
    );

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

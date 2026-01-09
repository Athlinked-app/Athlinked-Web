const profileService = require('./profile.service');

async function getUserProfile(req, res) {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const result = await profileService.getUserProfileService(userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get user profile controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

async function upsertUserProfile(req, res) {
  try {
    // Use userId from JWT token (set by authenticateToken middleware)
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const {
      fullName,
      profileImageUrl,
      coverImageUrl,
      bio,
      education,
      city,
      primarySport,
      sportsPlayed,
    } = req.body;

    const profileData = {};
    if (fullName !== undefined) profileData.fullName = fullName;
    if (profileImageUrl !== undefined)
      profileData.profileImageUrl = profileImageUrl;
    if (coverImageUrl !== undefined) profileData.coverImageUrl = coverImageUrl;
    if (bio !== undefined) profileData.bio = bio;
    if (education !== undefined) profileData.education = education;
    if (city !== undefined) profileData.city = city;
    if (primarySport !== undefined) profileData.primarySport = primarySport;
    if (sportsPlayed !== undefined) profileData.sportsPlayed = sportsPlayed;

    const result = await profileService.upsertUserProfileService(
      userId,
      profileData
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error('Upsert user profile controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

async function updateProfileImages(req, res) {
  try {
    // Use userId from JWT token (set by authenticateToken middleware)
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const { profileImageUrl, coverImageUrl } = req.body;

    const imageData = {};
    if (profileImageUrl !== undefined)
      imageData.profileImageUrl = profileImageUrl;
    if (coverImageUrl !== undefined) imageData.coverImageUrl = coverImageUrl;

    const result = await profileService.updateProfileImagesService(
      userId,
      imageData
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error('Update profile images controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

async function getCurrentUserProfile(req, res) {
  try {
    // Use userId from JWT token (set by authenticateToken middleware)
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const result = await profileService.getCurrentUserProfileService(userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get current user profile controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

module.exports = {
  getUserProfile,
  upsertUserProfile,
  updateProfileImages,
  getCurrentUserProfile,
};

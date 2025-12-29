const profileService = require('./profile.service');

/**
 * Controller to get user profile
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
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

/**
 * Controller to create or update user profile (UPSERT)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function upsertUserProfile(req, res) {
  try {
    // Try multiple ways to get userId (for flexibility with different auth setups)
    const userId = req.user?.id || req.body.userId || req.headers['x-user-id'];

    console.log('Upsert profile request:', {
      hasUser: !!req.user,
      userIdFromUser: req.user?.id,
      userIdFromBody: req.body.userId,
      userIdFromHeader: req.headers['x-user-id'],
      finalUserId: userId,
      body: req.body,
    });

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
      primarySport,
    } = req.body;

    const profileData = {};
    if (fullName !== undefined) profileData.fullName = fullName;
    if (profileImageUrl !== undefined) profileData.profileImageUrl = profileImageUrl;
    if (coverImageUrl !== undefined) profileData.coverImageUrl = coverImageUrl;
    if (bio !== undefined) profileData.bio = bio;
    if (education !== undefined) profileData.education = education;
    if (primarySport !== undefined) profileData.primarySport = primarySport;

    console.log('Profile data to save:', profileData);

    const result = await profileService.upsertUserProfileService(userId, profileData);
    console.log('Profile saved successfully:', result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Upsert user profile controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/**
 * Controller to update profile images only
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function updateProfileImages(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const { profileImageUrl, coverImageUrl } = req.body;

    const imageData = {};
    if (profileImageUrl !== undefined) imageData.profileImageUrl = profileImageUrl;
    if (coverImageUrl !== undefined) imageData.coverImageUrl = coverImageUrl;

    const result = await profileService.updateProfileImagesService(userId, imageData);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Update profile images controller error:', error);
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
};


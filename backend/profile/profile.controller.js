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

    console.log('Controller: Calling upsertUserProfileService with:', {
      userId: userId ? userId.substring(0, 8) + '...' : 'null',
      profileDataKeys: Object.keys(profileData),
      profileData: profileData,
    });

    const result = await profileService.upsertUserProfileService(
      userId,
      profileData
    );
    
    console.log('Controller: Service returned:', {
      success: result.success,
      message: result.message,
      profileKeys: result.profile ? Object.keys(result.profile) : 'no profile',
    });
    
    if (!result.success) {
      console.error('Controller: Service returned failure:', result);
      return res.status(400).json(result);
    }
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Upsert user profile controller error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
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

/**
 * Get user profile with athletic performance and sports (optimized for stats page)
 * GET /api/profile/:userId/stats-summary
 */
async function getUserProfileWithStats(req, res) {
  try {
    const { userId } = req.params;
    const { activeSport } = req.query; // Optional: filter athletic performance by sport

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const result = await profileService.getUserProfileWithStatsService(
      userId,
      activeSport || null
    );

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Get user profile with stats controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/**
 * Get complete user profile with all sections
 * GET /api/profile/:userId/complete
 */
async function getUserProfileComplete(req, res) {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id || null; // Get from auth token if available

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const result = await profileService.getUserProfileCompleteService(userId, currentUserId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Get user profile complete controller error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      position: error.position,
    });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred',
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        code: error.code,
        detail: error.detail,
      }),
    });
  }
}

module.exports = {
  getUserProfile,
  upsertUserProfile,
  updateProfileImages,
  getCurrentUserProfile,
  getUserProfileWithStats,
  getUserProfileComplete,
};

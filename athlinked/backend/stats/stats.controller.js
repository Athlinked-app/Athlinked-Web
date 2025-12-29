const statsService = require('./stats.service');

/**
 * 1. Get All Sports
 * GET /sports
 */
async function getAllSports(req, res) {
  try {
    const result = await statsService.getAllSportsService();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get all sports controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/**
 * 2. Get Positions for a Sport
 * GET /sports/:sportId/positions
 */
async function getPositionsBySport(req, res) {
  try {
    const { sportId } = req.params;
    
    if (!sportId) {
      return res.status(400).json({
        success: false,
        message: 'Sport ID is required',
      });
    }

    const result = await statsService.getPositionsBySportService(sportId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get positions by sport controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/**
 * 3. Get Fields for a Position
 * GET /positions/:positionId/fields
 */
async function getFieldsByPosition(req, res) {
  try {
    const { positionId } = req.params;
    
    if (!positionId) {
      return res.status(400).json({
        success: false,
        message: 'Position ID is required',
      });
    }

    const result = await statsService.getFieldsByPositionService(positionId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get fields by position controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/**
 * 4. Create / Update User Sport Profile
 * POST /user/sport-profile
 */
async function createOrUpdateUserSportProfile(req, res) {
  try {
    const userId = req.body.user_id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const { sportId, positionId } = req.body;

    if (!sportId || !positionId) {
      return res.status(400).json({
        success: false,
        message: 'sportId and positionId are required',
      });
    }

    const result = await statsService.createOrUpdateUserSportProfileService(
      userId,
      sportId,
      positionId
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error('Create or update user sport profile controller error:', error);
    if (error.message.includes('Invalid')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/**
 * 5. Save User Position Stats
 * POST /user/position-stats
 */
async function saveUserPositionStats(req, res) {
  try {
    const userId = req.body.user_id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const { userSportProfileId, stats } = req.body;

    if (!userSportProfileId) {
      return res.status(400).json({
        success: false,
        message: 'userSportProfileId is required',
      });
    }

    if (!stats || !Array.isArray(stats) || stats.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'stats array is required and cannot be empty',
      });
    }

    // Validate stats structure
    for (const stat of stats) {
      if (!stat.fieldId || stat.value === undefined || stat.value === null) {
        return res.status(400).json({
          success: false,
          message: 'Each stat must have fieldId and value',
        });
      }
    }

    const result = await statsService.saveUserPositionStatsService(
      userSportProfileId,
      stats
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error('Save user position stats controller error:', error);
    if (error.message.includes('invalid') || error.message.includes('Invalid')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/**
 * 6. Get User Stats for a Sport
 * GET /user/sport-profile/:id/stats
 */
async function getUserStatsByProfile(req, res) {
  try {
    const userId = req.query.user_id || req.body.user_id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const { id: userSportProfileId } = req.params;

    if (!userSportProfileId) {
      return res.status(400).json({
        success: false,
        message: 'User sport profile ID is required',
      });
    }

    const result = await statsService.getUserStatsByProfileService(userSportProfileId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get user stats by profile controller error:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/**
 * 7. Get All User Sport Profiles with Stats
 * GET /user/sport-profiles
 */
async function getAllUserSportProfiles(req, res) {
  try {
    const userId = req.query.user_id || req.body.user_id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const result = await statsService.getAllUserSportProfilesService(userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get all user sport profiles controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

module.exports = {
  getAllSports,
  getPositionsBySport,
  getFieldsByPosition,
  createOrUpdateUserSportProfile,
  saveUserPositionStats,
  getUserStatsByProfile,
  getAllUserSportProfiles,
};


const favoritesService = require('./favorites.service');

/**
 * Controller to add an athlete to coach's favorites
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function addFavorite(req, res) {
  try {
    const coachId = req.user?.id;
    const athleteId = req.params.athleteId;

    if (!coachId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    if (!athleteId) {
      return res.status(400).json({
        success: false,
        message: 'Athlete ID is required',
      });
    }

    const result = await favoritesService.addFavoriteService(coachId, athleteId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Add favorite controller error:', error);
    if (
      error.message.includes('Only coaches') ||
      error.message.includes('Can only add athletes')
    ) {
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
 * Controller to remove an athlete from coach's favorites
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function removeFavorite(req, res) {
  try {
    const coachId = req.user?.id;
    const athleteId = req.params.athleteId;

    if (!coachId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    if (!athleteId) {
      return res.status(400).json({
        success: false,
        message: 'Athlete ID is required',
      });
    }

    const result = await favoritesService.removeFavoriteService(
      coachId,
      athleteId
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error('Remove favorite controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/**
 * Controller to check if athlete is in coach's favorites
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function checkFavoriteStatus(req, res) {
  try {
    const coachId = req.user?.id;
    const athleteId = req.params.athleteId;

    if (!coachId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    if (!athleteId) {
      return res.status(400).json({
        success: false,
        message: 'Athlete ID is required',
      });
    }

    const result = await favoritesService.checkFavoriteStatusService(
      coachId,
      athleteId
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error('Check favorite status controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/**
 * Controller to get all favorites for a coach
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getFavorites(req, res) {
  try {
    const coachId = req.user?.id;

    if (!coachId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const result = await favoritesService.getFavoritesService(coachId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get favorites controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

module.exports = {
  addFavorite,
  removeFavorite,
  checkFavoriteStatus,
  getFavorites,
};


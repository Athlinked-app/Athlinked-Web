const searchService = require('./search.service');

/**
 * Controller to search and filter users
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function searchUsers(req, res) {
  try {
    const filters = {
      searchQuery: req.query.searchQuery || req.query.q || '',
      sortBy: req.query.sortBy || '',
      searchType: req.query.searchType || req.query.userType || '',
      collegeSchool: req.query.collegeSchool || req.query.education || '',
      location: req.query.location || req.query.city || '',
      achievements: req.query.achievements || '',
      sportSpecialization:
        req.query.sportSpecialization || req.query.sport || '',
      gender: req.query.gender || '',
      teamLevel: req.query.teamLevel || '',
      teamCaptain: req.query.teamCaptain || '',
    };

    const result = await searchService.searchUsersService(filters);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Search users controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/**
 * Controller to get user by ID
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getUserById(req, res) {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const result = await searchService.getUserByIdService(userId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Get user by ID controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/**
 * Controller to get all users
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getAllUsers(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 100;

    const result = await searchService.getAllUsersService(limit);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get all users controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

module.exports = {
  searchUsers,
  getUserById,
  getAllUsers,
};

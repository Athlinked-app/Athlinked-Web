const {
  getCompetitionClubsService,
  createCompetitionClubService,
  updateCompetitionClubService,
  deleteCompetitionClubService,
} = require('./competition-clubs.service');

/**
 * Get competition clubs for a user
 * GET /api/profile/:userId/competition-clubs
 */
async function getCompetitionClubsController(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const result = await getCompetitionClubsService(userId);
    res.json(result);
  } catch (error) {
    console.error('Error in getCompetitionClubsController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch competition clubs',
      error: error.message,
    });
  }
}

/**
 * Create a new competition club entry
 * POST /api/profile/:userId/competition-clubs
 */
async function createCompetitionClubController(req, res) {
  try {
    const { userId } = req.params;
    const data = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    if (!data.clubOrTravelTeamName) {
      return res.status(400).json({
        success: false,
        message: 'Club or Travel Team Name is required',
      });
    }

    const result = await createCompetitionClubService(userId, data);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error in createCompetitionClubController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create competition club',
      error: error.message,
    });
  }
}

/**
 * Update a competition club entry
 * PUT /api/profile/competition-clubs/:id
 */
async function updateCompetitionClubController(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Competition club ID is required',
      });
    }

    const result = await updateCompetitionClubService(id, data);
    res.json(result);
  } catch (error) {
    console.error('Error in updateCompetitionClubController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update competition club',
      error: error.message,
    });
  }
}

/**
 * Delete a competition club entry
 * DELETE /api/profile/competition-clubs/:id
 */
async function deleteCompetitionClubController(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Competition club ID is required',
      });
    }

    const result = await deleteCompetitionClubService(id);
    res.json(result);
  } catch (error) {
    console.error('Error in deleteCompetitionClubController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete competition club',
      error: error.message,
    });
  }
}

module.exports = {
  getCompetitionClubsController,
  createCompetitionClubController,
  updateCompetitionClubController,
  deleteCompetitionClubController,
};


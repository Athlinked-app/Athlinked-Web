const {
  getCharacterLeadershipService,
  createCharacterLeadershipService,
  updateCharacterLeadershipService,
  deleteCharacterLeadershipService,
} = require('./character-leadership.service');

/**
 * Get character and leadership for a user
 * GET /api/profile/:userId/character-leadership
 */
async function getCharacterLeadershipController(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const result = await getCharacterLeadershipService(userId);
    res.json(result);
  } catch (error) {
    console.error('Error in getCharacterLeadershipController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch character and leadership data',
      error: error.message,
    });
  }
}

/**
 * Create a new character and leadership entry
 * POST /api/profile/:userId/character-leadership
 */
async function createCharacterLeadershipController(req, res) {
  try {
    const { userId } = req.params;
    const data = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const result = await createCharacterLeadershipService(userId, data);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error in createCharacterLeadershipController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create character and leadership data',
      error: error.message,
    });
  }
}

/**
 * Update a character and leadership entry
 * PUT /api/profile/character-leadership/:id
 */
async function updateCharacterLeadershipController(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Character and leadership ID is required',
      });
    }

    const result = await updateCharacterLeadershipService(id, data);
    res.json(result);
  } catch (error) {
    console.error('Error in updateCharacterLeadershipController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update character and leadership data',
      error: error.message,
    });
  }
}

/**
 * Delete a character and leadership entry
 * DELETE /api/profile/character-leadership/:id
 */
async function deleteCharacterLeadershipController(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Character and leadership ID is required',
      });
    }

    const result = await deleteCharacterLeadershipService(id);
    res.json(result);
  } catch (error) {
    console.error('Error in deleteCharacterLeadershipController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete character and leadership data',
      error: error.message,
    });
  }
}

module.exports = {
  getCharacterLeadershipController,
  createCharacterLeadershipController,
  updateCharacterLeadershipController,
  deleteCharacterLeadershipController,
};

const {
  getAcademicBackgroundsService,
  createAcademicBackgroundService,
  updateAcademicBackgroundService,
  deleteAcademicBackgroundService,
} = require('./academic-backgrounds.service');

/**
 * Get academic backgrounds for a user
 * GET /api/profile/:userId/academic-backgrounds
 */
async function getAcademicBackgroundsController(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const result = await getAcademicBackgroundsService(userId);
    res.json(result);
  } catch (error) {
    console.error('Error in getAcademicBackgroundsController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch academic backgrounds',
      error: error.message,
    });
  }
}

/**
 * Create a new academic background
 * POST /api/profile/:userId/academic-backgrounds
 */
async function createAcademicBackgroundController(req, res) {
  try {
    const { userId } = req.params;
    const data = req.body;

    console.log('Create Academic Background - req.file:', req.file);
    console.log('Create Academic Background - req.body:', req.body);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    if (!data.school) {
      return res.status(400).json({
        success: false,
        message: 'School is required',
      });
    }

    // Handle PDF file upload if present
    if (req.file) {
      console.log('PDF file uploaded:', req.file.originalname);
      // Use S3 URL if available, otherwise fallback to local path (for backward compatibility)
      data.degreePdf = req.file.location || `/uploads/profile/pdfs/${req.file.filename}`;
    } else {
      console.log('No PDF file in request');
    }

    const result = await createAcademicBackgroundService(userId, data);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error in createAcademicBackgroundController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create academic background',
      error: error.message,
    });
  }
}

/**
 * Update an academic background
 * PUT /api/profile/academic-backgrounds/:id
 */
async function updateAcademicBackgroundController(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;

    console.log('Update Academic Background - req.file:', req.file);
    console.log('Update Academic Background - req.body:', req.body);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Academic background ID is required',
      });
    }

    // Handle PDF file upload if present
    if (req.file) {
      console.log('PDF file uploaded:', req.file.originalname);
      // Use S3 URL if available, otherwise fallback to local path (for backward compatibility)
      data.degreePdf = req.file.location || `/uploads/profile/pdfs/${req.file.filename}`;
    } else {
      console.log('No PDF file in request');
    }

    const result = await updateAcademicBackgroundService(id, data);
    res.json(result);
  } catch (error) {
    console.error('Error in updateAcademicBackgroundController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update academic background',
      error: error.message,
    });
  }
}

/**
 * Delete an academic background
 * DELETE /api/profile/academic-backgrounds/:id
 */
async function deleteAcademicBackgroundController(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Academic background ID is required',
      });
    }

    const result = await deleteAcademicBackgroundService(id);
    res.json(result);
  } catch (error) {
    console.error('Error in deleteAcademicBackgroundController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete academic background',
      error: error.message,
    });
  }
}

module.exports = {
  getAcademicBackgroundsController,
  createAcademicBackgroundController,
  updateAcademicBackgroundController,
  deleteAcademicBackgroundController,
};

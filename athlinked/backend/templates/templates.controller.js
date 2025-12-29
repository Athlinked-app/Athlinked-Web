const templatesService = require('./templates.service');
const upload = require('../utils/upload-resources');

/**
 * Controller to create a new template
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function createTemplate(req, res) {
  try {
    const userId = req.body.user_id || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const { title, description, file_url, file_type, file_size } = req.body;

    // Handle file upload
    let finalFileUrl = file_url;
    let finalFileType = file_type;
    let finalFileSize = file_size;

    if (req.file) {
      const uploadedFileUrl = `/uploads/${req.file.filename}`;
      finalFileUrl = uploadedFileUrl;
      finalFileType = req.file.mimetype || file_type;
      finalFileSize = req.file.size || file_size;
    }

    if (!finalFileUrl) {
      return res.status(400).json({
        success: false,
        message: 'file_url is required',
      });
    }

    const result = await templatesService.createTemplateService({
      user_id: userId,
      title,
      description,
      file_url: finalFileUrl,
      file_type: finalFileType,
      file_size: finalFileSize ? parseInt(finalFileSize) : null,
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error('Create template error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create template',
    });
  }
}

/**
 * Controller to get all active templates
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getAllTemplates(req, res) {
  try {
    const userId = req.query.user_id || req.user?.id || null;
    const result = await templatesService.getAllTemplatesService(userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get templates error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch templates',
    });
  }
}

/**
 * Controller to soft delete a template
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function deleteTemplate(req, res) {
  try {
    // Try to get user_id from body first, then from query, then from req.user
    const userId = req.body?.user_id || req.query?.user_id || req.user?.id;

    console.log('Delete template request:', {
      id: req.params.id,
      userId: userId ? userId.substring(0, 8) + '...' : null,
      body: req.body,
      query: req.query,
    });

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Template ID is required',
      });
    }

    const result = await templatesService.deleteTemplateService(id, userId);

    console.log('Delete template result:', result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Delete template controller error:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
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

module.exports = {
  createTemplate,
  getAllTemplates,
  deleteTemplate,
};

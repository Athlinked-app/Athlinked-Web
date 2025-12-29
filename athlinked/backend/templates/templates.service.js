const templatesModel = require('./templates.model');

/**
 * Create a new template
 * @param {object} templateData - Template data object
 * @returns {Promise<object>} Service result with created template
 */
async function createTemplateService(templateData) {
  try {
    const { user_id, title, description, file_url, file_type, file_size } =
      templateData;

    if (!file_url) {
      throw new Error('file_url is required');
    }

    const template = await templatesModel.createTemplate({
      user_id,
      title,
      description,
      file_url,
      file_type,
      file_size: file_size ? parseInt(file_size) : null,
    });

    return {
      success: true,
      template,
    };
  } catch (error) {
    console.error('Create template service error:', error.message);
    throw error;
  }
}

/**
 * Get all active templates
 * @returns {Promise<object>} Service result with templates array
 */
async function getAllTemplatesService() {
  try {
    const templates = await templatesModel.getAllTemplates();
    return {
      success: true,
      templates,
    };
  } catch (error) {
    console.error('Get all templates service error:', error.message);
    throw error;
  }
}

/**
 * Delete a template (hard delete)
 * @param {string} templateId - Template ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<object>} Service result
 */
async function deleteTemplateService(templateId, userId) {
  try {
    const template = await templatesModel.getTemplateById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    if (template.user_id !== userId) {
      throw new Error('Unauthorized: You can only delete your own templates');
    }

    const deleted = await templatesModel.deleteTemplate(templateId, userId);
    if (!deleted) {
      throw new Error('Failed to delete template');
    }

    return {
      success: true,
      message: 'Template deleted successfully',
    };
  } catch (error) {
    console.error('Delete template service error:', error);
    throw error;
  }
}

/**
 * Soft delete a template
 * @param {string} templateId - Template ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<object>} Service result
 * @deprecated Use deleteTemplateService instead for hard delete
 */
async function softDeleteTemplateService(templateId, userId) {
  try {
    if (!templateId) {
      throw new Error('Template ID is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    const template = await templatesModel.softDeleteTemplate(
      templateId,
      userId
    );

    if (!template) {
      throw new Error(
        'Template not found or you do not have permission to delete it'
      );
    }

    return {
      success: true,
      message: 'Template deleted successfully',
    };
  } catch (error) {
    console.error('Soft delete template service error:', error.message);
    throw error;
  }
}

module.exports = {
  createTemplateService,
  getAllTemplatesService,
  deleteTemplateService,
  softDeleteTemplateService,
};

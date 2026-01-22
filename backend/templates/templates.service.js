const templatesModel = require('./templates.model');
const { convertKeyToPresignedUrl } = require('../utils/s3');

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
 * @param {string} userId - Optional user ID to filter by
 * @returns {Promise<object>} Service result with templates array
 */
async function getAllTemplatesService(userId = null) {
  try {
    const templates = await templatesModel.getAllTemplates(userId);

    // Convert file_url S3 keys to presigned URLs
    const templatesWithPresignedUrls = await Promise.all(
      templates.map(async (template) => {
        if (template.file_url) {
          template.file_url = await convertKeyToPresignedUrl(template.file_url);
        }
        return template;
      })
    );

    return {
      success: true,
      templates: templatesWithPresignedUrls,
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

    let canDelete = false;

    // Check if user is the template owner
    if (template.user_id === userId) {
      canDelete = true;
    } else {
      // Check if user is a parent of the template author
      const signupModel = require('../signup/signup.model');
      const currentUser = await signupModel.findById(userId);
      
      if (!currentUser) {
        throw new Error('User not found');
      }

      // If current user is a parent, check if template author is their child
      if (currentUser.user_type === 'parent' && currentUser.email) {
        const templateAuthor = await signupModel.findById(template.user_id);
        
        if (templateAuthor && templateAuthor.parent_email && 
            templateAuthor.parent_email.toLowerCase().trim() === currentUser.email.toLowerCase().trim()) {
          canDelete = true;
        }
      }
    }

    if (!canDelete) {
      // User is neither the template owner nor the parent of the template author
      throw new Error('Unauthorized: You can only delete your own templates or templates from your athletes');
    }

    // Delete file from S3 if it exists
    if (template.file_url) {
      try {
        const { deleteFromS3 } = require('../utils/s3');
        await deleteFromS3(template.file_url);
        console.log('Deleted template file from S3:', template.file_url);
      } catch (s3Error) {
        // Log error but continue with database deletion
        console.error('Error deleting template file from S3:', s3Error.message);
      }
    }

    // Delete from database
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

const resourcesModel = require('./resources.model');

/**
 * Create a new resource
 * Special logic: First article, first video, and first template are stored in a single row
 * @param {object} resourceData - Resource data object
 * @returns {Promise<object>} Service result with created resource
 */
async function createResourceService(resourceData) {
  try {
    const {
      user_id,
      resource_type,
      title,
      description,
      article_link,
      video_url,
      video_duration,
      file_url,
      file_type,
      file_size,
    } = resourceData;

    // Validate resource_type
    if (
      !resource_type ||
      !['article', 'video', 'template'].includes(resource_type)
    ) {
      throw new Error(
        'Invalid resource_type. Must be article, video, or template'
      );
    }

    // Validate required fields based on resource type
    if (resource_type === 'article' && !article_link) {
      throw new Error('article_link is required for article resources');
    }

    if (resource_type === 'video' && !video_url) {
      throw new Error('video_url is required for video resources');
    }

    if (resource_type === 'template' && !file_url) {
      throw new Error('file_url is required for template resources');
    }

    // Check if this is the user's first resource of this type
    const isFirstOfType = !(await resourcesModel.userHasResourceType(
      user_id,
      resource_type
    ));

    console.log(
      `Resource upload - Type: ${resource_type}, IsFirstOfType: ${isFirstOfType}, UserId: ${user_id.substring(0, 8)}...`
    );

    // If this is the first resource of this type, check if user has a first combined row
    if (isFirstOfType) {
      const firstResource = await resourcesModel.getUserFirstResource(user_id);

      if (firstResource) {
        console.log(
          `Updating first resource row (ID: ${firstResource.id}) with ${resource_type} data`
        );
        // User has a first resource row - update it with the new type data
        // Only update fields for the current resource_type being uploaded
        const updateData = {
          resource_type: firstResource.resource_type, // Keep original type
          title: firstResource.title, // Keep original title
          description: firstResource.description || description || null,
        };

        // Only add/update the new type's data - don't touch other types' fields
        if (resource_type === 'article') {
          updateData.article_link = article_link;
          // Preserve existing video and template data if they exist
          if (firstResource.video_url) {
            updateData.video_url = firstResource.video_url;
            updateData.video_duration = firstResource.video_duration;
          }
          if (firstResource.file_url) {
            updateData.file_url = firstResource.file_url;
            updateData.file_type = firstResource.file_type;
            updateData.file_size = firstResource.file_size;
          }
        } else if (resource_type === 'video') {
          updateData.video_url = video_url;
          updateData.video_duration = video_duration
            ? parseInt(video_duration)
            : null;
          console.log(
            `Setting video_url: ${video_url}, video_duration: ${video_duration}`
          );
          // Preserve existing article and template data if they exist
          if (firstResource.article_link) {
            updateData.article_link = firstResource.article_link;
            console.log(
              `Preserving article_link: ${firstResource.article_link}`
            );
          }
          if (firstResource.file_url) {
            updateData.file_url = firstResource.file_url;
            updateData.file_type = firstResource.file_type;
            updateData.file_size = firstResource.file_size;
          }
        } else if (resource_type === 'template') {
          updateData.file_url = file_url;
          updateData.file_type = file_type;
          updateData.file_size = file_size ? parseInt(file_size) : null;
          // Preserve existing article and video data if they exist
          if (firstResource.article_link) {
            updateData.article_link = firstResource.article_link;
          }
          if (firstResource.video_url) {
            updateData.video_url = firstResource.video_url;
            updateData.video_duration = firstResource.video_duration;
          }
        }

        console.log('Update data:', {
          ...updateData,
          video_url: updateData.video_url
            ? updateData.video_url.substring(0, 50) + '...'
            : null,
        });

        const updatedResource = await resourcesModel.updateResource(
          firstResource.id,
          updateData
        );

        console.log('Updated resource:', {
          id: updatedResource.id,
          resource_type: updatedResource.resource_type,
          has_article: !!updatedResource.article_link,
          has_video: !!updatedResource.video_url,
          has_file: !!updatedResource.file_url,
        });

        return {
          success: true,
          resource: updatedResource,
        };
      }
    }

    // If no first resource exists, or this is not the first of its type, create a new row
    const resource = await resourcesModel.createResource({
      user_id,
      resource_type,
      title,
      description,
      article_link,
      video_url,
      video_duration: video_duration ? parseInt(video_duration) : null,
      file_url,
      file_type,
      file_size: file_size ? parseInt(file_size) : null,
    });

    return {
      success: true,
      resource,
    };
  } catch (error) {
    console.error('Create resource service error:', error.message);
    throw error;
  }
}

/**
 * Get all active resources
 * @param {string} userId - Optional user ID to filter by
 * @returns {Promise<object>} Service result with resources array
 */
async function getAllResourcesService(userId = null) {
  try {
    const resources = await resourcesModel.getAllResources(userId);
    return {
      success: true,
      resources,
    };
  } catch (error) {
    console.error('Get all resources service error:', error.message);
    throw error;
  }
}

/**
 * Get resources by type
 * @param {string} resourceType - Resource type (article, video, template)
 * @returns {Promise<object>} Service result with resources array
 */
async function getResourcesByTypeService(resourceType) {
  try {
    if (
      !resourceType ||
      !['article', 'video', 'template'].includes(resourceType)
    ) {
      throw new Error(
        'Invalid resource_type. Must be article, video, or template'
      );
    }

    const resources = await resourcesModel.getResourcesByType(resourceType);
    return {
      success: true,
      resources,
    };
  } catch (error) {
    console.error('Get resources by type service error:', error.message);
    throw error;
  }
}

/**
 * Soft delete a resource
 * @param {string} resourceId - Resource ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<object>} Service result
 */
async function softDeleteResourceService(resourceId, userId) {
  try {
    if (!resourceId) {
      throw new Error('Resource ID is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get resource to check ownership
    const resource = await resourcesModel.getResourceById(resourceId);
    if (!resource) {
      throw new Error('Resource not found');
    }

    // Check if user is the resource owner
    if (resource.user_id === userId) {
      // User owns the resource, allow deletion
      const deletedResource = await resourcesModel.softDeleteResource(
        resourceId,
        userId
      );

      if (!deletedResource) {
        throw new Error('Failed to delete resource');
      }

      return {
        success: true,
        message: 'Resource deleted successfully',
      };
    }

    // Check if user is a parent of the resource author
    const signupModel = require('../signup/signup.model');
    const currentUser = await signupModel.findById(userId);
    
    if (!currentUser) {
      throw new Error('User not found');
    }

    // If current user is a parent, check if resource author is their child
    if (currentUser.user_type === 'parent' && currentUser.email) {
      const resourceAuthor = await signupModel.findById(resource.user_id);
      
      if (resourceAuthor && resourceAuthor.parent_email && 
          resourceAuthor.parent_email.toLowerCase().trim() === currentUser.email.toLowerCase().trim()) {
        // Parent is deleting their child's resource - allow it
        const deletedResource = await resourcesModel.softDeleteResource(
          resourceId,
          userId
        );

        if (!deletedResource) {
          throw new Error('Failed to delete resource');
        }

        return {
          success: true,
          message: 'Resource deleted successfully',
        };
      }
    }

    // User is neither the resource owner nor the parent of the resource author
    throw new Error('Unauthorized: You can only delete your own resources or resources from your athletes');
  } catch (error) {
    console.error('Soft delete resource service error:', error.message);
    throw error;
  }
}

module.exports = {
  createResourceService,
  getAllResourcesService,
  getResourcesByTypeService,
  softDeleteResourceService,
};

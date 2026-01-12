const resourcesService = require('./resources.service');

/**
 * Controller to create a new resource
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function createResource(req, res) {
  try {
    const userId = req.body.user_id || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const {
      resource_type,
      title,
      description,
      article_link,
      video_url,
      video_duration,
      file_url,
      file_type,
      file_size,
    } = req.body;

    if (
      !resource_type ||
      !['article', 'video', 'template'].includes(resource_type)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resource_type. Must be article, video, or template',
      });
    }

    // Articles should not have file uploads - only links
    if (resource_type === 'article' && req.file) {
      return res.status(400).json({
        success: false,
        message: 'Articles only accept links, not file uploads',
      });
    }

    // Videos must have either a file upload or video_url
    if (resource_type === 'video' && !req.file && !video_url) {
      return res.status(400).json({
        success: false,
        message: 'Videos must have a video file upload',
      });
    }

    // Templates must have either a file upload or file_url
    if (resource_type === 'template' && !req.file && !file_url) {
      return res.status(400).json({
        success: false,
        message: 'Templates must have a PDF file upload',
      });
    }

    // Articles must have article_link
    if (resource_type === 'article' && !article_link) {
      return res.status(400).json({
        success: false,
        message: 'Articles must have a link',
      });
    }

    let finalFileUrl = file_url;
    let finalFileType = file_type;
    let finalFileSize = file_size;
    let finalVideoUrl = video_url;

    if (req.file) {
      const uploadedFileUrl = `/uploads/${req.file.filename}`;

      if (resource_type === 'video') {
        finalVideoUrl = uploadedFileUrl;
        finalFileType = req.file.mimetype;
        finalFileSize = req.file.size;
      } else if (resource_type === 'template') {
        finalFileUrl = uploadedFileUrl;
        finalFileType = req.file.mimetype || file_type;
        finalFileSize = req.file.size || file_size;
      }
    }

    const resourceData = {
      user_id: userId,
      resource_type,
      title: title || 'Untitled',
      description: description || null,
    };

    if (resource_type === 'article') {
      resourceData.article_link = article_link;
    } else if (resource_type === 'video') {
      resourceData.video_url = finalVideoUrl;
      resourceData.video_duration = video_duration
        ? parseInt(video_duration)
        : null;
    } else if (resource_type === 'template') {
      resourceData.file_url = finalFileUrl;
      resourceData.file_type = finalFileType;
      resourceData.file_size = finalFileSize ? parseInt(finalFileSize) : null;
    }

    console.log('Creating resource with data:', {
      ...resourceData,
      user_id: resourceData.user_id.substring(0, 8) + '...', // Log partial user_id for security
    });

    const result = await resourcesService.createResourceService(resourceData);

    return res.status(201).json(result);
  } catch (error) {
    console.error('Create resource error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create resource',
    });
  }
}

/**
 * Controller to get all active resources
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getAllResources(req, res) {
  try {
    const { type } = req.query;

    let result;
    if (type) {
      result = await resourcesService.getResourcesByTypeService(type);
    } else {
      result = await resourcesService.getAllResourcesService();
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Get resources error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch resources',
    });
  }
}

/**
 * Controller to soft delete a resource
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function deleteResource(req, res) {
  try {
    const userId = req.body.user_id || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const { id } = req.params;

    const result = await resourcesService.softDeleteResourceService(id, userId);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Delete resource error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete resource',
    });
  }
}

module.exports = {
  createResource,
  getAllResources,
  deleteResource,
};

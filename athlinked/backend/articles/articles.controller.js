const articlesService = require('./articles.service');

/**
 * Controller to create a new article
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function createArticle(req, res) {
  try {
    const userId = req.body.user_id || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const {
      title,
      description,
      article_link,
    } = req.body;

    const result = await articlesService.createArticleService({
      user_id: userId,
      title,
      description,
      article_link,
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error('Create article error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create article',
    });
  }
}

/**
 * Controller to get all active articles
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getAllArticles(req, res) {
  try {
    const result = await articlesService.getAllArticlesService();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get articles error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch articles',
    });
  }
}

/**
 * Controller to soft delete an article
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function deleteArticle(req, res) {
  try {
    const userId = req.body?.user_id || req.query?.user_id || req.user?.id;
    
    console.log('Delete article request:', {
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
        message: 'Article ID is required',
      });
    }

    const result = await articlesService.deleteArticleService(id, userId);

    console.log('Delete article result:', result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Delete article error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete article',
    });
  }
}

module.exports = {
  createArticle,
  getAllArticles,
  deleteArticle,
};


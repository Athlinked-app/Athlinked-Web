const articlesModel = require('./articles.model');

/**
 * Create a new article
 * @param {object} articleData - Article data object
 * @returns {Promise<object>} Service result with created article
 */
async function createArticleService(articleData) {
  try {
    const { user_id, title, description, article_link } = articleData;

    if (!article_link) {
      throw new Error('article_link is required');
    }

    const article = await articlesModel.createArticle({
      user_id,
      title,
      description,
      article_link,
    });

    return {
      success: true,
      article,
    };
  } catch (error) {
    console.error('Create article service error:', error.message);
    throw error;
  }
}

/**
 * Get all active articles
 * @param {string} userId - Optional user ID to filter by
 * @returns {Promise<object>} Service result with articles array
 */
async function getAllArticlesService(userId = null) {
  try {
    const articles = await articlesModel.getAllArticles(userId);
    return {
      success: true,
      articles,
    };
  } catch (error) {
    console.error('Get all articles service error:', error.message);
    throw error;
  }
}

/**
 * Delete an article (hard delete)
 * @param {string} articleId - Article ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<object>} Service result
 */
async function deleteArticleService(articleId, userId) {
  try {
    const article = await articlesModel.getArticleById(articleId);
    if (!article) {
      throw new Error('Article not found');
    }

    // Check if user is the article owner
    if (article.user_id === userId) {
      // User owns the article, allow deletion
      const deleted = await articlesModel.deleteArticle(articleId, userId);
      if (!deleted) {
        throw new Error('Failed to delete article');
      }

      return {
        success: true,
        message: 'Article deleted successfully',
      };
    }

    // Check if user is a parent of the article author
    const signupModel = require('../signup/signup.model');
    const currentUser = await signupModel.findById(userId);
    
    if (!currentUser) {
      throw new Error('User not found');
    }

    // If current user is a parent, check if article author is their child
    if (currentUser.user_type === 'parent' && currentUser.email) {
      const articleAuthor = await signupModel.findById(article.user_id);
      
      if (articleAuthor && articleAuthor.parent_email && 
          articleAuthor.parent_email.toLowerCase().trim() === currentUser.email.toLowerCase().trim()) {
        // Parent is deleting their child's article - allow it
        const deleted = await articlesModel.deleteArticle(articleId, userId);
        if (!deleted) {
          throw new Error('Failed to delete article');
        }

        return {
          success: true,
          message: 'Article deleted successfully',
        };
      }
    }

    // User is neither the article owner nor the parent of the article author
    throw new Error('Unauthorized: You can only delete your own articles or articles from your athletes');
  } catch (error) {
    console.error('Delete article service error:', error);
    throw error;
  }
}

/**
 * Soft delete an article
 * @param {string} articleId - Article ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<object>} Service result
 * @deprecated Use deleteArticleService instead for hard delete
 */
async function softDeleteArticleService(articleId, userId) {
  try {
    if (!articleId) {
      throw new Error('Article ID is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    const article = await articlesModel.softDeleteArticle(articleId, userId);

    if (!article) {
      throw new Error(
        'Article not found or you do not have permission to delete it'
      );
    }

    return {
      success: true,
      message: 'Article deleted successfully',
    };
  } catch (error) {
    console.error('Soft delete article service error:', error.message);
    throw error;
  }
}

module.exports = {
  createArticleService,
  getAllArticlesService,
  deleteArticleService,
  softDeleteArticleService,
};

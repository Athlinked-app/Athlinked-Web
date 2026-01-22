const postsModel = require('./posts.model');
const pool = require('../config/db');
const { createNotification } = require('../notifications/notifications.helper');
const { convertKeyToPresignedUrl, convertKeysToPresignedUrls } = require('../utils/s3');

/**
 * Extract mentions from text (format: @fullname)
 * @param {string} text - Text to parse
 * @returns {Array<string>} Array of mentioned full names
 */
function extractMentions(text) {
  if (!text) return [];
  const mentions = [];
  const regex = /@([^\s@]+)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  return [...new Set(mentions)]; // Remove duplicates
}

/**
 * Get user IDs for mentioned full names (only followers)
 * @param {string} actorUserId - User who created the post/comment
 * @param {Array<string>} mentionedNames - Array of full names
 * @returns {Promise<Array<{id: string, full_name: string}>>} Array of user objects
 */
async function getMentionedUsers(actorUserId, mentionedNames) {
  if (mentionedNames.length === 0) return [];

  try {
    // Get users who are followers of the actor and match the mentioned names
    const query = `
      SELECT DISTINCT u.id, u.full_name
      FROM users u
      INNER JOIN network n ON n.following_id = u.id
      WHERE n.follower_id = $1
        AND u.full_name = ANY($2::text[])
    `;

    const result = await pool.query(query, [actorUserId, mentionedNames]);
    return result.rows;
  } catch (error) {
    console.error('Error getting mentioned users:', error);
    return [];
  }
}

async function createPostService(postData, userId) {
  try {
    const userQuery =
      'SELECT full_name, profile_url, user_type FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];

    const postDataWithUser = {
      ...postData,
      user_id: userId,
      username: user.full_name || 'User',
      user_profile_url: user.profile_url || null,
      user_type: user.user_type || 'athlete',
    };

    const createdPost = await postsModel.createPost(postDataWithUser);

    // Handle mentions in caption
    const textToCheck = postData.caption || postData.article_body || '';
    const mentionedNames = extractMentions(textToCheck);

    if (mentionedNames.length > 0) {
      const mentionedUsers = await getMentionedUsers(userId, mentionedNames);

      // Create notifications for each mentioned user
      for (const mentionedUser of mentionedUsers) {
        try {
          await createNotification({
            recipientUserId: mentionedUser.id,
            actorUserId: userId,
            actorFullName: user.full_name || 'User',
            type: 'mention',
            entityType: 'post',
            entityId: createdPost.id,
            message: `${user.full_name || 'User'} mentioned you in a post`,
          });
        } catch (error) {
          console.error(
            `Error creating mention notification for ${mentionedUser.id}:`,
            error
          );
          // Continue with other notifications even if one fails
        }
      }
    }

    return {
      success: true,
      message: 'Post created successfully',
      post: createdPost,
    };
  } catch (error) {
    console.error('Create post service error:', error);
    throw error;
  }
}

async function getPostsFeedService(page = 1, limit = 50, viewerUserId = null, postType = null) {
  try {
    // Validate post_type if provided
    if (postType && !['photo', 'video', 'article', 'event', 'text'].includes(postType)) {
      throw new Error('Invalid post_type. Must be photo, video, article, event, or text');
    }

    const posts = await postsModel.getPostsFeed(page, limit, viewerUserId, postType);
    
    // Convert user_profile_url S3 keys to presigned URLs
    const postsWithPresignedUrls = await Promise.all(
      posts.map(async (post) => {
        if (post.user_profile_url) {
          post.user_profile_url = await convertKeyToPresignedUrl(post.user_profile_url);
        }
        if (post.media_url) {
          post.media_url = await convertKeyToPresignedUrl(post.media_url);
        }
        return post;
      })
    );
    
    return {
      success: true,
      posts: postsWithPresignedUrls,
      page,
      limit,
    };
  } catch (error) {
    console.error('Get posts feed service error:', error);
    throw error;
  }
}

async function checkLikeStatusService(postId, userId) {
  try {
    const isLiked = await postsModel.checkLikeStatus(postId, userId);
    return {
      success: true,
      isLiked,
    };
  } catch (error) {
    console.error('Check like status service error:', error);
    throw error;
  }
}

async function likePostService(postId, userId) {
  const client = await pool.connect();
  try {
    const post = await postsModel.getPostById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Get actor user info
    const userQuery = 'SELECT full_name FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);
    const actorFullName = userResult.rows[0]?.full_name || 'User';

    await client.query('BEGIN');
    try {
      const likeResult = await postsModel.likePost(postId, userId, client);
      await client.query('COMMIT');

      // Create notification for post owner if not the liker
      if (post.user_id !== userId) {
        try {
          console.log('Creating like notification:', {
            recipientUserId: post.user_id,
            actorUserId: userId,
            actorFullName: actorFullName,
            postId: postId,
          });

          const notification = await createNotification({
            recipientUserId: post.user_id,
            actorUserId: userId,
            actorFullName: actorFullName,
            type: 'like',
            entityType: 'post',
            entityId: postId,
            message: `${actorFullName} liked your post`,
          });

          console.log(
            'Like notification created successfully:',
            notification?.id
          );
        } catch (error) {
          console.error('Error creating like notification:', error);
          console.error('Error stack:', error.stack);
          // Don't throw - notification failure shouldn't break the like operation
        }
      } else {
        console.log('Skipping notification: user liked their own post');
      }

      return {
        success: true,
        message: 'Post liked successfully',
        like_count: likeResult.like_count,
      };
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
      throw error;
    }
  } catch (error) {
    console.error('Like post service error:', error);
    throw error;
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error('Error releasing database connection:', releaseError);
      }
    }
  }
}

async function unlikePostService(postId, userId) {
  const client = await pool.connect();
  try {
    const post = await postsModel.getPostById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    await client.query('BEGIN');
    try {
      const unlikeResult = await postsModel.unlikePost(postId, userId, client);
      await client.query('COMMIT');

      return {
        success: true,
        message: 'Post unliked successfully',
        like_count: unlikeResult.like_count,
      };
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
      throw error;
    }
  } catch (error) {
    console.error('Unlike post service error:', error);
    throw error;
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error('Error releasing database connection:', releaseError);
      }
    }
  }
}

async function addCommentService(postId, userId, comment) {
  const client = await pool.connect();
  try {
    const post = await postsModel.getPostById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Get actor user info
    const userQuery = 'SELECT full_name FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);
    const actorFullName = userResult.rows[0]?.full_name || 'User';

    await client.query('BEGIN');
    try {
      const commentResult = await postsModel.addComment(
        postId,
        userId,
        comment,
        client
      );
      await client.query('COMMIT');

      // Handle mentions in comment
      const mentionedNames = extractMentions(comment);

      if (mentionedNames.length > 0) {
        const mentionedUsers = await getMentionedUsers(userId, mentionedNames);

        // Create notifications for each mentioned user
        for (const mentionedUser of mentionedUsers) {
          try {
            await createNotification({
              recipientUserId: mentionedUser.id,
              actorUserId: userId,
              actorFullName: actorFullName,
              type: 'mention',
              entityType: 'comment',
              entityId: commentResult.comment.id,
              message: `${actorFullName} mentioned you in a comment`,
            });
          } catch (error) {
            console.error(
              `Error creating mention notification for ${mentionedUser.id}:`,
              error
            );
          }
        }
      }

      // Create notification for post owner if not the commenter
      if (post.user_id !== userId) {
        try {
          await createNotification({
            recipientUserId: post.user_id,
            actorUserId: userId,
            actorFullName: actorFullName,
            type: 'comment',
            entityType: 'post',
            entityId: postId,
            message: `${actorFullName} commented on your post`,
          });
        } catch (error) {
          console.error('Error creating comment notification:', error);
        }
      }

      return {
        success: true,
        message: 'Comment added successfully',
        comment: commentResult.comment,
        comment_count: commentResult.comment_count,
      };
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
      throw error;
    }
  } catch (error) {
    console.error('Add comment service error:', error);
    throw error;
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error('Error releasing database connection:', releaseError);
      }
    }
  }
}

async function replyToCommentService(commentId, userId, comment) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    try {
      const replyResult = await postsModel.replyToComment(
        commentId,
        userId,
        comment,
        client
      );
      await client.query('COMMIT');
      return {
        success: true,
        message: 'Reply added successfully',
        comment: replyResult.comment,
        comment_count: replyResult.comment_count,
      };
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
      throw error;
    }
  } catch (error) {
    console.error('Reply to comment service error:', error);
    throw error;
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error('Error releasing database connection:', releaseError);
      }
    }
  }
}

async function savePostService(postId, userId) {
  const client = await pool.connect();
  try {
    const post = await postsModel.getPostById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    await client.query('BEGIN');
    try {
      const saveResult = await postsModel.savePost(postId, userId, client);
      await client.query('COMMIT');
      return {
        success: true,
        message: 'Post saved successfully',
        save_count: saveResult.save_count,
      };
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
      throw error;
    }
  } catch (error) {
    console.error('Save post service error:', error);
    throw error;
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error('Error releasing database connection:', releaseError);
      }
    }
  }
}

async function getCommentsByPostIdService(postId) {
  try {
    const post = await postsModel.getPostById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    const comments = await postsModel.getCommentsByPostId(postId);
    
    // Convert user_profile_url S3 keys to presigned URLs in comments
    const commentsWithPresignedUrls = await Promise.all(
      comments.map(async (comment) => {
        if (comment.user_profile_url) {
          comment.user_profile_url = await convertKeyToPresignedUrl(comment.user_profile_url);
        }
        return comment;
      })
    );
    
    return {
      success: true,
      comments: commentsWithPresignedUrls,
    };
  } catch (error) {
    console.error('Get comments service error:', error);
    throw error;
  }
}

async function deletePostService(postId, userId) {
  try {
    const post = await postsModel.getPostById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    let canDelete = false;

    // Check if user is the post owner
    if (post.user_id === userId) {
      canDelete = true;
    } else {
      // Check if user is a parent of the post author
      const signupModel = require('../signup/signup.model');
      const currentUser = await signupModel.findById(userId);
      
      if (!currentUser) {
        throw new Error('User not found');
      }

      // If current user is a parent, check if post author is their child
      if (currentUser.user_type === 'parent' && currentUser.email) {
        const postAuthor = await signupModel.findById(post.user_id);
        
        if (postAuthor && postAuthor.parent_email && 
            postAuthor.parent_email.toLowerCase().trim() === currentUser.email.toLowerCase().trim()) {
          canDelete = true;
        }
      }
    }

    if (!canDelete) {
      // User is neither the post owner nor the parent of the post author
      throw new Error('Unauthorized: You can only delete your own posts or posts from your athletes');
    }

    // Delete media file from S3 if it exists
    if (post.media_url) {
      try {
        const { deleteFromS3 } = require('../utils/s3');
        await deleteFromS3(post.media_url);
        console.log('Deleted post media from S3:', post.media_url);
      } catch (s3Error) {
        // Log error but continue with database deletion
        console.error('Error deleting post media from S3:', s3Error.message);
      }
    }

    // Delete from database
    const deleted = await postsModel.deletePost(postId, userId);
    if (!deleted) {
      throw new Error('Failed to delete post');
    }

    return {
      success: true,
      message: 'Post deleted successfully',
    };
  } catch (error) {
    console.error('Delete post service error:', error);
    throw error;
  }
}

module.exports = {
  createPostService,
  getPostsFeedService,
  checkLikeStatusService,
  likePostService,
  unlikePostService,
  addCommentService,
  replyToCommentService,
  savePostService,
  getCommentsByPostIdService,
  deletePostService,
};

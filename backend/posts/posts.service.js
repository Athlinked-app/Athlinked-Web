const postsModel = require('./posts.model');
const pool = require('../config/db');
const { createNotification } = require('../notifications/notifications.helper');
const { convertKeyToPresignedUrl, convertKeysToPresignedUrls } = require('../utils/s3');

/**
 * Extract mentions from text (format: @fullname - supports multi-word names)
 * @param {string} text - Text to parse
 * @returns {Array<string>} Array of mentioned full names
 */
function extractMentions(text) {
  if (!text) return [];
  const mentions = [];
  // Updated regex to capture multi-word names: @ followed by any characters until @, newline, or end
  // This handles cases like "@John Doe" or "@John Doe Smith"
  const regex = /@([^\s@\n]+(?:\s+[^\s@\n]+)*)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    // Trim whitespace and add to mentions
    const mention = match[1].trim();
    if (mention) {
      mentions.push(mention);
    }
  }
  return [...new Set(mentions)]; // Remove duplicates
}

/**
 * Get user IDs for mentioned full names (followers and people the actor follows)
 * @param {string} actorUserId - User who created the post/comment
 * @param {Array<string>} mentionedNames - Array of full names
 * @returns {Promise<Array<{id: string, full_name: string}>>} Array of user objects
 */
async function getMentionedUsers(actorUserId, mentionedNames) {
  if (mentionedNames.length === 0) return [];

  try {
    // Normalize mentioned names: trim whitespace and handle case-insensitive matching
    const normalizedNames = mentionedNames.map(name => name.trim());
    
    // Get users who are either:
    // 1. Followers of the actor (uf.follower_id = u.id AND uf.following_id = actorUserId)
    // 2. People the actor follows (uf.follower_id = actorUserId AND uf.following_id = u.id)
    // 3. Connected users (automatically considered as following each other)
    // Use case-insensitive matching with LOWER() and TRIM() for full_name
    const query = `
      SELECT DISTINCT u.id, u.full_name
      FROM users u
      WHERE LOWER(TRIM(u.full_name)) = ANY(
        SELECT LOWER(TRIM(unnest($2::text[])))
      )
      AND (
        -- Direct follow relationships
        EXISTS (
          SELECT 1 FROM user_follows uf 
          WHERE (
            (uf.follower_id = u.id AND uf.following_id = $1) OR
            (uf.follower_id = $1 AND uf.following_id = u.id)
          )
        )
        OR
        -- Connected users (automatically considered as following each other)
        EXISTS (
          SELECT 1 FROM user_connections uc
          WHERE (
            (uc.user_id_1 = $1 AND uc.user_id_2 = u.id) OR
            (uc.user_id_1 = u.id AND uc.user_id_2 = $1)
          )
        )
      )
    `;

    console.log('[Mention Lookup] Querying for mentioned users:', {
      actorUserId,
      mentionedNames,
      normalizedNames,
    });

    const result = await pool.query(query, [actorUserId, normalizedNames]);
    
    console.log('[Mention Lookup] Query result:', {
      mentionedNames,
      normalizedNames,
      foundCount: result.rows.length,
      foundUsers: result.rows.map(u => ({ id: u.id, full_name: u.full_name })),
    });

    return result.rows;
  } catch (error) {
    console.error('[Mention Lookup] Error getting mentioned users:', {
      error: error.message,
      stack: error.stack,
      actorUserId,
      mentionedNames,
    });
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

    console.log('[Post Mentions] Extracted mentions:', {
      textToCheck,
      mentionedNames,
      postId: createdPost.id,
      userId,
    });

    if (mentionedNames.length > 0) {
      const mentionedUsers = await getMentionedUsers(userId, mentionedNames);

      console.log('[Post Mentions] Found mentioned users:', {
        mentionedNames,
        foundUsers: mentionedUsers.map(u => ({ id: u.id, full_name: u.full_name })),
        count: mentionedUsers.length,
      });

      // Create notifications for each mentioned user
      for (const mentionedUser of mentionedUsers) {
        try {
          const notification = await createNotification({
            recipientUserId: mentionedUser.id,
            actorUserId: userId,
            actorFullName: user.full_name || 'User',
            type: 'mention',
            entityType: 'post',
            entityId: createdPost.id,
            message: `${user.full_name || 'User'} mentioned you in a post`,
          });

          console.log('[Post Mentions] Notification created:', {
            notificationId: notification?.id,
            recipientUserId: mentionedUser.id,
            recipientName: mentionedUser.full_name,
          });
        } catch (error) {
          console.error(
            `[Post Mentions] Error creating mention notification for ${mentionedUser.id}:`,
            error
          );
          // Continue with other notifications even if one fails
        }
      }

      if (mentionedUsers.length === 0) {
        console.warn('[Post Mentions] No users found for mentions:', {
          mentionedNames,
          userId,
          message: 'Users may not have network relationship or names may not match',
        });
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

      console.log('[Post Comment Mentions] Extracted mentions:', {
        comment,
        mentionedNames,
        commentId: commentResult.comment.id,
        postId,
        userId,
        actorFullName,
      });

      if (mentionedNames.length > 0) {
        const mentionedUsers = await getMentionedUsers(userId, mentionedNames);

        console.log('[Post Comment Mentions] Found mentioned users:', {
          mentionedNames,
          foundUsers: mentionedUsers.map(u => ({ id: u.id, full_name: u.full_name })),
          count: mentionedUsers.length,
        });

        // Create notifications for each mentioned user
        for (const mentionedUser of mentionedUsers) {
          try {
            const notification = await createNotification({
              recipientUserId: mentionedUser.id,
              actorUserId: userId,
              actorFullName: actorFullName,
              type: 'mention',
              entityType: 'comment',
              entityId: commentResult.comment.id,
              message: `${actorFullName} mentioned you in a comment`,
            });

            console.log('[Post Comment Mentions] Notification created:', {
              notificationId: notification?.id,
              recipientUserId: mentionedUser.id,
              recipientName: mentionedUser.full_name,
              message: `${actorFullName} mentioned you in a comment`,
            });
          } catch (error) {
            console.error(
              `[Post Comment Mentions] Error creating mention notification for ${mentionedUser.id}:`,
              error
            );
          }
        }

        if (mentionedUsers.length === 0) {
          console.warn('[Post Comment Mentions] No users found for mentions:', {
            mentionedNames,
            userId,
            message: 'Users may not have network relationship or names may not match',
          });
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

async function checkPostSaveStatusService(postId, userId) {
  try {
    const isSaved = await postsModel.checkPostSaveStatus(postId, userId);
    return {
      success: true,
      isSaved: isSaved,
    };
  } catch (error) {
    console.error('Check post save status service error:', error);
    throw error;
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

async function unsavePostService(postId, userId) {
  const client = await pool.connect();
  try {
    const post = await postsModel.getPostById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    await client.query('BEGIN');
    try {
      const unsaveResult = await postsModel.unsavePost(postId, userId, client);
      await client.query('COMMIT');
      return {
        success: true,
        message: 'Post unsaved successfully',
        save_count: unsaveResult.save_count,
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
    console.error('Unsave post service error:', error);
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

/**
 * Get saved posts for a user
 * @param {string} userId - User UUID
 * @param {number} limit - Limit of posts to return
 * @returns {Promise<object>} Service result with saved posts
 */
async function getSavedPostsService(userId, limit = 50) {
  try {
    const posts = await postsModel.getSavedPostsByUserId(userId, limit);

    // Convert S3 keys to presigned URLs
    const postsWithPresignedUrls = await Promise.all(
      posts.map(async (post) => {
        if (post.user_profile_url) {
          post.user_profile_url = await convertKeyToPresignedUrl(post.user_profile_url);
        }
        if (post.post_author_profile_url) {
          post.post_author_profile_url = await convertKeyToPresignedUrl(post.post_author_profile_url);
        }
        if (post.author_profile_url) {
          post.author_profile_url = await convertKeyToPresignedUrl(post.author_profile_url);
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
    };
  } catch (error) {
    console.error('Get saved posts service error:', error.message);
    console.error('Error stack:', error.stack);
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
  checkPostSaveStatusService,
  savePostService,
  unsavePostService,
  getCommentsByPostIdService,
  deletePostService,
  getSavedPostsService,
};

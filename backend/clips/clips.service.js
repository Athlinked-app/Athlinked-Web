const clipsModel = require('./clips.model');
const pool = require('../config/db');
const { convertKeyToPresignedUrl } = require('../utils/s3');
const { createNotification } = require('../notifications/notifications.helper');

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
 * @param {string} actorUserId - User who created the clip/comment
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

    const result = await pool.query(query, [actorUserId, normalizedNames]);

    return result.rows;
  } catch (error) {
    console.error('[Clip Mention Lookup] Error getting mentioned users:', {
      error: error.message,
      stack: error.stack,
      actorUserId,
      mentionedNames,
    });
    return [];
  }
}

/**
 * Create a new clip
 * @param {object} clipData - Clip data including user_id
 * @returns {Promise<object>} Service result with created clip
 */
async function createClipService(clipData) {
  let client = null;
  try {
    const { user_id, video_url, description } = clipData;

    if (!user_id || !video_url) {
      throw new Error('User ID and video URL are required');
    }

    const user = await clipsModel.getUserById(user_id);
    if (!user) {
      throw new Error('User not found');
    }

    client = await pool.connect();
    try {
      await client.query('BEGIN');

      const clipDataWithUser = {
        user_id,
        username: user.full_name || 'User',
        user_profile_url: null, // You can add profile_url to users table later
        video_url,
        description: description || null,
      };

      const createdClip = await clipsModel.createClip(clipDataWithUser, client);

      await client.query('COMMIT');

      // Handle mentions in description
      const textToCheck = description || '';
      const mentionedNames = extractMentions(textToCheck);

      if (mentionedNames.length > 0) {
        const mentionedUsers = await getMentionedUsers(user_id, mentionedNames);

        // Create notifications for each mentioned user
        for (const mentionedUser of mentionedUsers) {
          try {
            await createNotification({
              recipientUserId: mentionedUser.id,
              actorUserId: user_id,
              actorFullName: user.full_name || 'User',
              type: 'mention',
              entityType: 'clip',
              entityId: createdClip.id,
              message: `${user.full_name || 'User'} mentioned you in a clip`,
            });
          } catch (error) {
            console.error(
              `Error creating mention notification for ${mentionedUser.id}:`,
              error
            );
          }
        }
      }

      return {
        success: true,
        clip: createdClip,
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
    console.error('Create clip service error:', error.message);
    console.error('Error stack:', error.stack);
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

/**
 * Get clips feed with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {string} viewerUserId - Optional viewer user ID for privacy filtering
 * @returns {Promise<object>} Service result with clips and pagination
 */
async function getClipsFeedService(page = 1, limit = 10, viewerUserId = null) {
  try {
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const result = await clipsModel.getClipsFeed(pageNum, limitNum, viewerUserId);

    // Convert user_profile_url and video_url S3 keys to presigned URLs
    if (result.clips && Array.isArray(result.clips)) {
      result.clips = await Promise.all(
        result.clips.map(async (clip) => {
          if (clip.user_profile_url) {
            clip.user_profile_url = await convertKeyToPresignedUrl(clip.user_profile_url);
          }
          if (clip.video_url) {
            clip.video_url = await convertKeyToPresignedUrl(clip.video_url);
          }
          return clip;
        })
      );
    }

    return {
      success: true,
      ...result,
    };
  } catch (error) {
    console.error('Get clips feed service error:', error.message);
    throw error;
  }
}

/**
 * Add a comment to a clip
 * @param {string} clipId - Clip UUID
 * @param {object} commentData - Comment data including user_id
 * @returns {Promise<object>} Service result with created comment
 */
async function addCommentService(clipId, commentData) {
  let client = null;
  try {
    const { user_id, comment } = commentData;

    if (!user_id || !comment) {
      throw new Error('User ID and comment are required');
    }

    const clip = await clipsModel.getClipById(clipId);
    if (!clip) {
      throw new Error('Clip not found');
    }

    client = await pool.connect();
    try {
      await client.query('BEGIN');

      const newComment = await clipsModel.addComment(
        {
          clip_id: clipId,
          user_id,
          comment,
        },
        client
      );

      await clipsModel.incrementCommentCount(clipId, client);

      await client.query('COMMIT');

      // Handle mentions in comment (after commit to avoid transaction issues)
      const mentionedNames = extractMentions(comment);

      if (mentionedNames.length > 0) {
        // Get actor user info for notification
        const userQuery = 'SELECT full_name FROM users WHERE id = $1';
        const userResult = await pool.query(userQuery, [user_id]);
        const actorFullName = userResult.rows[0]?.full_name || 'User';

        const mentionedUsers = await getMentionedUsers(user_id, mentionedNames);

        // Create notifications for each mentioned user
        for (const mentionedUser of mentionedUsers) {
          try {
            await createNotification({
              recipientUserId: mentionedUser.id,
              actorUserId: user_id,
              actorFullName: actorFullName,
              type: 'mention',
              entityType: 'comment',
              entityId: newComment.id,
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

      return {
        success: true,
        comment: newComment,
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
    console.error('Add comment service error:', error.message);
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

/**
 * Reply to a comment
 * @param {string} commentId - Parent comment UUID
 * @param {object} replyData - Reply data including user_id
 * @returns {Promise<object>} Service result with created reply
 */
async function replyToCommentService(commentId, replyData) {
  let client = null;
  try {
    const { user_id, comment } = replyData;

    if (!user_id || !comment) {
      throw new Error('User ID and comment are required');
    }

    const parentComment = await clipsModel.getCommentById(commentId);
    if (!parentComment) {
      throw new Error('Parent comment not found');
    }

    const clipId = parentComment.clip_id;

    client = await pool.connect();
    try {
      await client.query('BEGIN');

      const reply = await clipsModel.addComment(
        {
          clip_id: clipId,
          user_id,
          comment,
          parent_comment_id: commentId,
        },
        client
      );

      await clipsModel.incrementCommentCount(clipId, client);

      await client.query('COMMIT');

      // Handle mentions in reply (after commit to avoid transaction issues)
      const mentionedNames = extractMentions(comment);

      console.log('[Clip Reply Mentions] Extracted mentions:', {
        comment,
        mentionedNames,
        replyId: reply.id,
        clipId,
        userId: user_id,
      });

      if (mentionedNames.length > 0) {
        // Get actor user info for notification
        const userQuery = 'SELECT full_name FROM users WHERE id = $1';
        const userResult = await pool.query(userQuery, [user_id]);
        const actorFullName = userResult.rows[0]?.full_name || 'User';

        const mentionedUsers = await getMentionedUsers(user_id, mentionedNames);

        console.log('[Clip Reply Mentions] Found mentioned users:', {
          mentionedNames,
          foundUsers: mentionedUsers.map(u => ({ id: u.id, full_name: u.full_name })),
          count: mentionedUsers.length,
        });

        // Create notifications for each mentioned user
        for (const mentionedUser of mentionedUsers) {
          try {
            const notification = await createNotification({
              recipientUserId: mentionedUser.id,
              actorUserId: user_id,
              actorFullName: actorFullName,
              type: 'mention',
              entityType: 'comment',
              entityId: reply.id,
              message: `${actorFullName} mentioned you in a comment`,
            });

            console.log('[Clip Reply Mentions] Notification created:', {
              notificationId: notification?.id,
              recipientUserId: mentionedUser.id,
              recipientName: mentionedUser.full_name,
            });
          } catch (error) {
            console.error(
              `[Clip Reply Mentions] Error creating mention notification for ${mentionedUser.id}:`,
              error
            );
            // Continue with other notifications even if one fails
          }
        }

        if (mentionedUsers.length === 0) {
          console.warn('[Clip Reply Mentions] No users found for mentions:', {
            mentionedNames,
            userId: user_id,
            message: 'Users may not have network relationship or names may not match',
          });
        }
      }

      return {
        success: true,
        comment: reply,
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
    console.error('Reply to comment service error:', error.message);
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

/**
 * Get comments for a clip
 * @param {string} clipId - Clip UUID
 * @returns {Promise<object>} Service result with comments
 */
async function getClipCommentsService(clipId) {
  try {
    const clip = await clipsModel.getClipById(clipId);
    if (!clip) {
      throw new Error('Clip not found');
    }

    const comments = await clipsModel.getClipComments(clipId);

    // Convert user_profile_url S3 keys to presigned URLs in comments
    const commentsWithPresignedUrls = await Promise.all(
      comments.map(async (comment) => {
        if (comment.user_profile_url) {
          comment.user_profile_url = await convertKeyToPresignedUrl(comment.user_profile_url);
        }
        // Handle nested replies
        if (comment.replies && Array.isArray(comment.replies)) {
          comment.replies = await Promise.all(
            comment.replies.map(async (reply) => {
              if (reply.user_profile_url) {
                reply.user_profile_url = await convertKeyToPresignedUrl(reply.user_profile_url);
              }
              return reply;
            })
          );
        }
        return comment;
      })
    );

    return {
      success: true,
      comments: commentsWithPresignedUrls,
    };
  } catch (error) {
    console.error('Get clip comments service error:', error.message);
    throw error;
  }
}

/**
 * Delete a clip (hard delete)
 * @param {string} clipId - Clip ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<object>} Service result
 */
async function deleteClipService(clipId, userId) {
  try {
    const clip = await clipsModel.getClipById(clipId);
    if (!clip) {
      throw new Error('Clip not found');
    }

    let canDelete = false;

    // Check if user is the clip owner
    if (clip.user_id === userId) {
      canDelete = true;
    } else {
      // Check if user is a parent of the clip author
      const signupModel = require('../signup/signup.model');
      const currentUser = await signupModel.findById(userId);
      
      if (!currentUser) {
        throw new Error('User not found');
      }

      // If current user is a parent, check if clip author is their child
      if (currentUser.user_type === 'parent' && currentUser.email) {
        const clipAuthor = await signupModel.findById(clip.user_id);
        
        if (clipAuthor && clipAuthor.parent_email && 
            clipAuthor.parent_email.toLowerCase().trim() === currentUser.email.toLowerCase().trim()) {
          canDelete = true;
        }
      }
    }

    if (!canDelete) {
      // User is neither the clip owner nor the parent of the clip author
      throw new Error('Unauthorized: You can only delete your own clips or clips from your athletes');
    }

    // Delete video file from S3 if it exists
    if (clip.video_url) {
      try {
        const { deleteFromS3 } = require('../utils/s3');
        await deleteFromS3(clip.video_url);
        console.log('Deleted clip video from S3:', clip.video_url);
      } catch (s3Error) {
        // Log error but continue with database deletion
        console.error('Error deleting clip video from S3:', s3Error.message);
      }
    }

    // Delete from database
    const deleted = await clipsModel.deleteClip(clipId, userId);
    if (!deleted) {
      throw new Error('Failed to delete clip');
    }

    return {
      success: true,
      message: 'Clip deleted successfully',
    };
  } catch (error) {
    console.error('Delete clip service error:', error);
    throw error;
  }
}

/**
 * Save a clip
 * @param {string} clipId - Clip UUID
 * @param {string} userId - User UUID
 * @returns {Promise<object>} Service result
 */
async function saveClipService(clipId, userId) {
  const client = await pool.connect();
  try {
    const clip = await clipsModel.getClipById(clipId);
    if (!clip) {
      throw new Error('Clip not found');
    }

    await client.query('BEGIN');
    try {
      const saveResult = await clipsModel.saveClip(clipId, userId, client);
      await client.query('COMMIT');
      return {
        success: true,
        message: 'Clip saved successfully',
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
    console.error('Save clip service error:', error);
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

/**
 * Unsave a clip
 * @param {string} clipId - Clip UUID
 * @param {string} userId - User UUID
 * @returns {Promise<object>} Service result
 */
async function unsaveClipService(clipId, userId) {
  const client = await pool.connect();
  try {
    const clip = await clipsModel.getClipById(clipId);
    if (!clip) {
      throw new Error('Clip not found');
    }

    await client.query('BEGIN');
    try {
      const unsaveResult = await clipsModel.unsaveClip(clipId, userId, client);
      await client.query('COMMIT');
      return {
        success: true,
        message: 'Clip unsaved successfully',
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
    console.error('Unsave clip service error:', error);
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

/**
 * Get saved clips for a user
 * @param {string} userId - User UUID
 * @param {number} limit - Limit of clips to return
 * @returns {Promise<object>} Service result with saved clips
 */
async function getSavedClipsService(userId, limit = 50) {
  try {
    const clips = await clipsModel.getSavedClipsByUserId(userId, limit);

    // Convert S3 keys to presigned URLs
    const clipsWithPresignedUrls = await Promise.all(
      clips.map(async (clip) => {
        if (clip.user_profile_url) {
          clip.user_profile_url = await convertKeyToPresignedUrl(clip.user_profile_url);
        }
        if (clip.author_profile_url) {
          clip.author_profile_url = await convertKeyToPresignedUrl(clip.author_profile_url);
        }
        if (clip.video_url) {
          clip.video_url = await convertKeyToPresignedUrl(clip.video_url);
        }
        return clip;
      })
    );

    return {
      success: true,
      clips: clipsWithPresignedUrls,
    };
  } catch (error) {
    console.error('Get saved clips service error:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

module.exports = {
  createClipService,
  getClipsFeedService,
  addCommentService,
  replyToCommentService,
  getClipCommentsService,
  deleteClipService,
  likeClipService,
  unlikeClipService,
  saveClipService,
  unsaveClipService,
  getSavedClipsService,
};

async function likeClipService(clipId, userId) {
  const client = await pool.connect();
  try {
    const clip = await clipsModel.getClipById(clipId);
    if (!clip) {
      throw new Error('Clip not found');
    }

    await client.query('BEGIN');
    try {
      const likeResult = await clipsModel.likeClip(clipId, userId, client);
      await client.query('COMMIT');
      return {
        success: true,
        message: 'Clip liked successfully',
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
    console.error('Like clip service error:', error);
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

async function unlikeClipService(clipId, userId) {
  const client = await pool.connect();
  try {
    const clip = await clipsModel.getClipById(clipId);
    if (!clip) {
      throw new Error('Clip not found');
    }

    await client.query('BEGIN');
    try {
      const unlikeResult = await clipsModel.unlikeClip(clipId, userId, client);
      await client.query('COMMIT');
      return {
        success: true,
        message: 'Clip unliked successfully',
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
    console.error('Unlike clip service error:', error);
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

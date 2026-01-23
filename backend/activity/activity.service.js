const profileModel = require('../profile/profile.model');
const clipsModel = require('../clips/clips.model');
const { convertKeyToPresignedUrl } = require('../utils/s3');

/**
 * Get my activity service - fetches only the user's own posts and clips
 * @param {string} userId - User ID
 * @param {number} limit - Limit of items to return per type
 * @returns {Promise<object>} Service result with posts and clips
 */
async function getMyActivityService(userId, limit = 50) {
  try {
    // Fetch user's own posts and clips in parallel
    // getUserPosts returns all post types (photo, video, article, event, text) for the user
    // Pass userId as viewerUserId to include is_saved field
    const [userPosts, userClips] = await Promise.all([
      profileModel.getUserPosts(userId, limit, userId),
      clipsModel.getClipsByUserId(userId, limit, userId),
    ]);

    // Convert S3 keys to presigned URLs for posts
    const postsWithPresignedUrls = await Promise.all(
      userPosts.map(async (post) => {
        if (post.user_profile_url) {
          post.user_profile_url = await convertKeyToPresignedUrl(post.user_profile_url);
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

    // Convert S3 keys to presigned URLs for clips
    const clipsWithPresignedUrls = await Promise.all(
      userClips.map(async (clip) => {
        if (clip.user_profile_url) {
          clip.user_profile_url = await convertKeyToPresignedUrl(clip.user_profile_url);
        }
        if (clip.video_url) {
          clip.video_url = await convertKeyToPresignedUrl(clip.video_url);
        }
        return clip;
      })
    );

    return {
      success: true,
      posts: postsWithPresignedUrls,
      clips: clipsWithPresignedUrls,
    };
  } catch (error) {
    console.error('Get my activity service error:', error.message);
    throw error;
  }
}

module.exports = {
  getMyActivityService,
};

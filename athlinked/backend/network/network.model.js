const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Follow a user
 * @param {string} followerId - User ID of the follower
 * @param {string} followingId - User ID of the user to follow
 * @returns {Promise<boolean>} True if follow was successful, false if already following
 */
async function followUser(followerId, followingId) {
  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

    const checkQuery = 'SELECT id FROM user_follows WHERE follower_id = $1 AND following_id = $2';
    const checkResult = await dbClient.query(checkQuery, [followerId, followingId]);
    
    if (checkResult.rows.length > 0) {
      await dbClient.query('ROLLBACK');
      return false;
    }

    if (followerId === followingId) {
      await dbClient.query('ROLLBACK');
      throw new Error('Cannot follow yourself');
    }

    const followerQuery = 'SELECT username, full_name FROM users WHERE id = $1';
    const followingQuery = 'SELECT username, full_name FROM users WHERE id = $1';
    
    const [followerResult, followingResult] = await Promise.all([
      dbClient.query(followerQuery, [followerId]),
      dbClient.query(followingQuery, [followingId]),
    ]);

    if (followerResult.rows.length === 0 || followingResult.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      throw new Error('User not found');
    }

    const followerUsername = followerResult.rows[0].username || followerResult.rows[0].full_name || 'User';
    const followingUsername = followingResult.rows[0].username || followingResult.rows[0].full_name || 'User';

    const id = uuidv4();
    const insertQuery = `
      INSERT INTO user_follows (id, follower_id, following_id, follower_username, following_username, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `;
    await dbClient.query(insertQuery, [id, followerId, followingId, followerUsername, followingUsername]);

    await dbClient.query(
      'UPDATE users SET following = following + 1 WHERE id = $1',
      [followerId]
    );

    await dbClient.query(
      'UPDATE users SET followers = followers + 1 WHERE id = $1',
      [followingId]
    );

    await dbClient.query('COMMIT');
    return true;
  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error('Error following user:', error);
    throw error;
  } finally {
    dbClient.release();
  }
}

/**
 * Unfollow a user
 * @param {string} followerId - User ID of the follower
 * @param {string} followingId - User ID of the user to unfollow
 * @returns {Promise<boolean>} True if unfollow was successful, false if not following
 */
async function unfollowUser(followerId, followingId) {
  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

    const checkQuery = 'SELECT id FROM user_follows WHERE follower_id = $1 AND following_id = $2';
    const checkResult = await dbClient.query(checkQuery, [followerId, followingId]);
    
    if (checkResult.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      return false;
    }

    await dbClient.query(
      'DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId]
    );

    await dbClient.query(
      'UPDATE users SET following = GREATEST(following - 1, 0) WHERE id = $1',
      [followerId]
    );

    await dbClient.query(
      'UPDATE users SET followers = GREATEST(followers - 1, 0) WHERE id = $1',
      [followingId]
    );

    await dbClient.query('COMMIT');
    return true;
  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error('Error unfollowing user:', error);
    throw error;
  } finally {
    dbClient.release();
  }
}

/**
 * Get followers list for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of follower user data
 */
async function getFollowers(userId) {
  const query = `
    SELECT 
      u.id,
      u.username,
      u.full_name,
      u.user_type,
      u.profile_url
    FROM users u
    INNER JOIN user_follows uf ON u.id = uf.follower_id
    WHERE uf.following_id = $1
    ORDER BY uf.created_at DESC
  `;
  
  try {
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching followers:', error);
    throw error;
  }
}

/**
 * Get following list for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of following user data
 */
async function getFollowing(userId) {
  const query = `
    SELECT 
      u.id,
      u.username,
      u.full_name,
      u.user_type,
      u.profile_url
    FROM users u
    INNER JOIN user_follows uf ON u.id = uf.following_id
    WHERE uf.follower_id = $1
    ORDER BY uf.created_at DESC
  `;
  
  try {
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching following:', error);
    throw error;
  }
}

/**
 * Get follow counts for a user
 * @param {string} userId - User ID
 * @returns {Promise<object>} Object with followers and following counts
 */
async function getFollowCounts(userId) {
  const query = 'SELECT followers, following FROM users WHERE id = $1';
  
  try {
    const result = await pool.query(query, [userId]);
    if (result.rows.length === 0) {
      return { followers: 0, following: 0 };
    }
    return {
      followers: result.rows[0].followers || 0,
      following: result.rows[0].following || 0,
    };
  } catch (error) {
    console.error('Error fetching follow counts:', error);
    throw error;
  }
}

/**
 * Check if a user is following another user
 * @param {string} followerId - User ID of the potential follower
 * @param {string} followingId - User ID of the potential following
 * @returns {Promise<boolean>} True if following, false otherwise
 */
async function isFollowing(followerId, followingId) {
  const query = 'SELECT id FROM user_follows WHERE follower_id = $1 AND following_id = $2';
  
  try {
    const result = await pool.query(query, [followerId, followingId]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking follow status:', error);
    throw error;
  }
}

module.exports = {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowCounts,
  isFollowing,
};


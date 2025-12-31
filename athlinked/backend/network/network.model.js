const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { createNotification } = require('../notifications/notifications.helper');

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

    const checkQuery =
      'SELECT id FROM user_follows WHERE follower_id = $1 AND following_id = $2';
    const checkResult = await dbClient.query(checkQuery, [
      followerId,
      followingId,
    ]);

    if (checkResult.rows.length > 0) {
      await dbClient.query('ROLLBACK');
      return false;
    }

    if (followerId === followingId) {
      await dbClient.query('ROLLBACK');
      throw new Error('Cannot follow yourself');
    }

    const followerQuery = 'SELECT username, full_name FROM users WHERE id = $1';
    const followingQuery =
      'SELECT username, full_name FROM users WHERE id = $1';

    const [followerResult, followingResult] = await Promise.all([
      dbClient.query(followerQuery, [followerId]),
      dbClient.query(followingQuery, [followingId]),
    ]);

    if (followerResult.rows.length === 0 || followingResult.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      throw new Error('User not found');
    }

    const followerUsername =
      followerResult.rows[0].username ||
      followerResult.rows[0].full_name ||
      'User';
    const followingUsername =
      followingResult.rows[0].username ||
      followingResult.rows[0].full_name ||
      'User';

    const id = uuidv4();
    const insertQuery = `
      INSERT INTO user_follows (id, follower_id, following_id, follower_username, following_username, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `;
    await dbClient.query(insertQuery, [
      id,
      followerId,
      followingId,
      followerUsername,
      followingUsername,
    ]);

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

    const checkQuery =
      'SELECT id FROM user_follows WHERE follower_id = $1 AND following_id = $2';
    const checkResult = await dbClient.query(checkQuery, [
      followerId,
      followingId,
    ]);

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
  const query =
    'SELECT id FROM user_follows WHERE follower_id = $1 AND following_id = $2';

  try {
    const result = await pool.query(query, [followerId, followingId]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking follow status:', error);
    throw error;
  }
}

async function sendConnectionRequest(requesterId, receiverId) {
  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

    if (requesterId === receiverId) {
      await dbClient.query('ROLLBACK');
      throw new Error('Cannot send connection request to yourself');
    }

    const checkExistingQuery = `
      SELECT id, status FROM connection_requests 
      WHERE (requester_id = $1 AND receiver_id = $2) 
         OR (requester_id = $2 AND receiver_id = $1)
    `;
    const checkResult = await dbClient.query(checkExistingQuery, [
      requesterId,
      receiverId,
    ]);

    if (checkResult.rows.length > 0) {
      const existing = checkResult.rows[0];
      if (existing.status === 'pending') {
        await dbClient.query('ROLLBACK');
        return {
          success: false,
          message: 'Connection request already pending',
        };
      }
      if (existing.status === 'accepted') {
        await dbClient.query('ROLLBACK');
        return { success: false, message: 'Already connected' };
      }
    }

    const checkFollowQuery =
      'SELECT id FROM user_follows WHERE follower_id = $1 AND following_id = $2';
    const followCheck = await dbClient.query(checkFollowQuery, [
      requesterId,
      receiverId,
    ]);

    if (followCheck.rows.length > 0) {
      await dbClient.query('ROLLBACK');
      return { success: false, message: 'Already following this user' };
    }

    const id = uuidv4();
    const insertQuery = `
      INSERT INTO connection_requests (id, requester_id, receiver_id, status, created_at)
      VALUES ($1, $2, $3, 'pending', NOW())
      ON CONFLICT (requester_id, receiver_id) DO UPDATE
      SET status = 'pending', updated_at = NOW()
      RETURNING *
    `;
    const result = await dbClient.query(insertQuery, [
      id,
      requesterId,
      receiverId,
    ]);

    await dbClient.query('COMMIT');

    const requesterQuery = 'SELECT full_name FROM users WHERE id = $1';
    const requesterResult = await pool.query(requesterQuery, [requesterId]);
    const requesterName = requesterResult.rows[0]?.full_name || 'Someone';

    try {
      await createNotification({
        recipientUserId: receiverId,
        actorUserId: requesterId,
        actorFullName: requesterName,
        type: 'connection_request',
        entityType: 'profile',
        entityId: requesterId,
        message: `${requesterName} sent you a connection request`,
      });
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }

    return { success: true, request: result.rows[0] };
  } catch (error) {
    await dbClient.query('ROLLBACK');
    if (error.code === '23505') {
      return { success: false, message: 'Connection request already exists' };
    }
    console.error('Error sending connection request:', error);
    throw error;
  } finally {
    dbClient.release();
  }
}

async function acceptConnectionRequest(requestId, receiverId) {
  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

    const getRequestQuery = `
      SELECT * FROM connection_requests 
      WHERE id = $1 AND receiver_id = $2 AND status = 'pending'
    `;
    const requestResult = await dbClient.query(getRequestQuery, [
      requestId,
      receiverId,
    ]);

    if (requestResult.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      return { success: false, message: 'Connection request not found' };
    }

    const request = requestResult.rows[0];
    const requesterId = request.requester_id;

    const updateQuery = `
      UPDATE connection_requests 
      SET status = 'accepted', updated_at = NOW()
      WHERE id = $1
    `;
    await dbClient.query(updateQuery, [requestId]);

    const requesterQuery =
      'SELECT username, full_name FROM users WHERE id = $1';
    const receiverQuery = 'SELECT username, full_name FROM users WHERE id = $1';

    const [requesterResult, receiverResult] = await Promise.all([
      dbClient.query(requesterQuery, [requesterId]),
      dbClient.query(receiverQuery, [receiverId]),
    ]);

    const requesterUsername =
      requesterResult.rows[0].username ||
      requesterResult.rows[0].full_name ||
      'User';
    const receiverUsername =
      receiverResult.rows[0].username ||
      receiverResult.rows[0].full_name ||
      'User';

    const followId1 = uuidv4();
    const followId2 = uuidv4();

    const insertFollow1 = `
      INSERT INTO user_follows (id, follower_id, following_id, follower_username, following_username, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `;
    const insertFollow2 = `
      INSERT INTO user_follows (id, follower_id, following_id, follower_username, following_username, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `;

    await dbClient.query(insertFollow1, [
      followId1,
      requesterId,
      receiverId,
      requesterUsername,
      receiverUsername,
    ]);
    await dbClient.query(insertFollow2, [
      followId2,
      receiverId,
      requesterId,
      receiverUsername,
      requesterUsername,
    ]);

    await dbClient.query(
      'UPDATE users SET following = following + 1, followers = followers + 1 WHERE id = $1',
      [requesterId]
    );
    await dbClient.query(
      'UPDATE users SET following = following + 1, followers = followers + 1 WHERE id = $1',
      [receiverId]
    );

    await dbClient.query('COMMIT');

    const receiverName =
      receiverResult.rows[0].full_name ||
      receiverResult.rows[0].username ||
      'Someone';

    try {
      await createNotification({
        recipientUserId: requesterId,
        actorUserId: receiverId,
        actorFullName: receiverName,
        type: 'connection_accepted',
        entityType: 'profile',
        entityId: receiverId,
        message: `${receiverName} accepted your connection request`,
      });
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }

    return { success: true };
  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error('Error accepting connection request:', error);
    throw error;
  } finally {
    dbClient.release();
  }
}

async function rejectConnectionRequest(requestId, receiverId) {
  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

    const getRequestQuery = `
      SELECT * FROM connection_requests 
      WHERE id = $1 AND receiver_id = $2 AND status = 'pending'
    `;
    const requestResult = await dbClient.query(getRequestQuery, [
      requestId,
      receiverId,
    ]);

    if (requestResult.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      return { success: false, message: 'Connection request not found' };
    }

    const deleteQuery = 'DELETE FROM connection_requests WHERE id = $1';
    await dbClient.query(deleteQuery, [requestId]);

    await dbClient.query('COMMIT');
    return { success: true };
  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error('Error rejecting connection request:', error);
    throw error;
  } finally {
    dbClient.release();
  }
}

async function getConnectionRequests(userId) {
  const query = `
    SELECT 
      cr.id,
      cr.requester_id,
      cr.receiver_id,
      cr.status,
      cr.created_at,
      u.id as user_id,
      u.username,
      u.full_name,
      u.user_type,
      u.profile_url
    FROM connection_requests cr
    INNER JOIN users u ON u.id = cr.requester_id
    WHERE cr.receiver_id = $1 AND cr.status = 'pending'
    ORDER BY cr.created_at DESC
  `;

  try {
    const result = await pool.query(query, [userId]);
    console.log(
      `Found ${result.rows.length} connection requests for user ${userId}`
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching connection requests:', error);
    throw error;
  }
}

async function checkConnectionRequestStatus(requesterId, receiverId) {
  try {
    const connectionQuery = `
      SELECT id, status 
      FROM connection_requests 
      WHERE requester_id = $1 AND receiver_id = $2
    `;
    const connectionResult = await pool.query(connectionQuery, [
      requesterId,
      receiverId,
    ]);

    if (connectionResult.rows.length > 0) {
      const status = connectionResult.rows[0].status;
      if (status === 'accepted') {
        return { exists: true, status: 'connected' };
      }
      return { exists: true, status: status };
    }

    const mutualFollowQuery = `
      SELECT 
        (SELECT COUNT(*) FROM user_follows WHERE follower_id = $1 AND following_id = $2) as user1_follows_user2,
        (SELECT COUNT(*) FROM user_follows WHERE follower_id = $2 AND following_id = $1) as user2_follows_user1
    `;
    const mutualResult = await pool.query(mutualFollowQuery, [
      requesterId,
      receiverId,
    ]);

    if (mutualResult.rows.length > 0) {
      const row = mutualResult.rows[0];
      if (row.user1_follows_user2 > 0 && row.user2_follows_user1 > 0) {
        return { exists: true, status: 'connected' };
      }
    }

    return { exists: false, status: null };
  } catch (error) {
    console.error('Error checking connection request status:', error);
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
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getConnectionRequests,
  checkConnectionRequestStatus,
};

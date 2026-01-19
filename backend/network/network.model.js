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
    try {
      await dbClient.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
    console.error('Error following user:', error);
    throw error;
  } finally {
    if (dbClient) {
      try {
        dbClient.release();
      } catch (releaseError) {
        console.error('Error releasing database connection:', releaseError);
      }
    }
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

    const deleteFollowResult = await dbClient.query(
      'DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId]
    );
    console.log(`[unfollowUser] Follow relationship deleted: ${deleteFollowResult.rowCount} row(s) removed from user_follows table`);

    await dbClient.query(
      'UPDATE users SET following = GREATEST(following - 1, 0) WHERE id = $1',
      [followerId]
    );

    await dbClient.query(
      'UPDATE users SET followers = GREATEST(followers - 1, 0) WHERE id = $1',
      [followingId]
    );

    // Verify follow was deleted from database
    const verifyFollowQuery = `
      SELECT id FROM user_follows 
      WHERE follower_id = $1 AND following_id = $2
    `;
    const verifyFollow = await dbClient.query(verifyFollowQuery, [followerId, followingId]);
    if (verifyFollow.rows.length === 0) {
      console.log(`[unfollowUser] ✅ Verified: Follow relationship removed from database`);
    } else {
      console.error(`[unfollowUser] ❌ ERROR: Follow relationship still exists in database!`);
    }

    // IMPORTANT: If users are connected, remove the connection AND reverse follow when unfollowing
    // Business Rule: When two users are mutually connected and one unfollows the other:
    // 1. Remove the follow relationship (User A → User B)
    // 2. Remove the reverse follow relationship (User B → User A) if it exists
    // 3. Remove the connection (affects both users)
    // This ensures the connection is completely cut for BOTH users
    const connectionCheckQuery = `
      SELECT id FROM user_connections 
      WHERE (user_id_1 = $1 AND user_id_2 = $2) 
         OR (user_id_1 = $2 AND user_id_2 = $1)
    `;
    const connectionCheck = await dbClient.query(connectionCheckQuery, [
      followerId,
      followingId,
    ]);

    if (connectionCheck.rows.length > 0) {
      console.log(`[unfollowUser] Users are connected. Removing connection and reverse follow for BOTH users.`);
      
      // Remove the reverse follow relationship (User B → User A) if it exists
      // When connected users unfollow, we remove both directions to completely cut the connection
      const reverseFollowCheckQuery = `
        SELECT id FROM user_follows 
        WHERE follower_id = $1 AND following_id = $2
      `;
      const reverseFollowCheck = await dbClient.query(reverseFollowCheckQuery, [
        followingId, // Reverse: the person being unfollowed
        followerId,  // Reverse: the person doing the unfollowing
      ]);

      if (reverseFollowCheck.rows.length > 0) {
        console.log(`[unfollowUser] Removing reverse follow relationship (${followingId.substring(0, 8)}... → ${followerId.substring(0, 8)}...)`);
        const reverseFollowDeleteResult = await dbClient.query(
          'DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2',
          [followingId, followerId]
        );
        console.log(`[unfollowUser] Reverse follow deleted: ${reverseFollowDeleteResult.rowCount} row(s) removed from user_follows table`);

        // Update counts for reverse follow removal
        await dbClient.query(
          'UPDATE users SET following = GREATEST(following - 1, 0) WHERE id = $1',
          [followingId]
        );

        await dbClient.query(
          'UPDATE users SET followers = GREATEST(followers - 1, 0) WHERE id = $1',
          [followerId]
        );

        // Verify reverse follow was deleted from database
        const verifyReverseFollowQuery = `
          SELECT id FROM user_follows 
          WHERE follower_id = $1 AND following_id = $2
        `;
        const verifyReverseFollow = await dbClient.query(verifyReverseFollowQuery, [followingId, followerId]);
        if (verifyReverseFollow.rows.length === 0) {
          console.log(`[unfollowUser] ✅ Verified: Reverse follow relationship removed from database`);
        } else {
          console.error(`[unfollowUser] ❌ ERROR: Reverse follow still exists in database!`);
        }
      }

      // IMPORTANT: Connections are mutual - stored as a single record with normalized order (user_id_1 < user_id_2)
      // When we delete the connection, it removes it for BOTH users simultaneously
      // This ensures that if User A unfollows User B, the connection is cut for both User A and User B
      console.log(`[unfollowUser] Removing mutual connection between ${followerId.substring(0, 8)}... and ${followingId.substring(0, 8)}... (connection removed for BOTH users)`);
      const deleteConnectionQuery = `
        DELETE FROM user_connections 
        WHERE (user_id_1 = $1 AND user_id_2 = $2) 
           OR (user_id_1 = $2 AND user_id_2 = $1)
      `;
      const deleteResult = await dbClient.query(deleteConnectionQuery, [followerId, followingId]);
      console.log(`[unfollowUser] Connection deleted: ${deleteResult.rowCount} row(s) removed from user_connections table (connection cut for both users)`);

      // Verify connection was deleted from database
      const verifyConnectionQuery = `
        SELECT id FROM user_connections 
        WHERE (user_id_1 = $1 AND user_id_2 = $2) 
           OR (user_id_1 = $2 AND user_id_2 = $1)
      `;
      const verifyConnection = await dbClient.query(verifyConnectionQuery, [followerId, followingId]);
      if (verifyConnection.rows.length === 0) {
        console.log(`[unfollowUser] ✅ Verified: Connection removed from database for BOTH users`);
      } else {
        console.error(`[unfollowUser] ❌ ERROR: Connection still exists in database!`);
      }
    }

    await dbClient.query('COMMIT');
    console.log(`[unfollowUser] ✅ Transaction committed successfully. All database changes persisted.`);
    return true;
  } catch (error) {
    try {
      await dbClient.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
    console.error('Error unfollowing user:', error);
    throw error;
  } finally {
    // Always release connection, even if there was an error
    if (dbClient) {
      try {
        dbClient.release();
      } catch (releaseError) {
        console.error('Error releasing database connection:', releaseError);
      }
    }
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
 * Includes both direct follows and connected users (connected users are automatically considered as following)
 * 
 * Business Rule: Connected users automatically appear in the following list
 * This ensures UI shows "Following" button for connected users without needing separate follow action
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of following user data
 */
async function getFollowing(userId) {
  const query = `
    SELECT DISTINCT
      u.id,
      u.username,
      u.full_name,
      u.user_type,
      u.profile_url
    FROM users u
    WHERE u.id IN (
      -- Direct follows
      SELECT following_id 
      FROM user_follows 
      WHERE follower_id = $1
      
      UNION
      
      -- Connected users (automatically considered as following)
      -- Business Rule: If users are connected, they are automatically following each other
      SELECT 
        CASE 
          WHEN user_id_1 = $1 THEN user_id_2 
          ELSE user_id_1 
        END as connected_user_id
      FROM user_connections 
      WHERE user_id_1 = $1 OR user_id_2 = $1
    )
    AND u.id != $1
    ORDER BY u.full_name ASC
  `;

  try {
    const result = await pool.query(query, [userId]);
    console.log(`[getFollowing] Found ${result.rows.length} users (includes direct follows and connections) for user ${userId.substring(0, 8)}...`);
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
 * @returns {Promise<boolean>} True if following OR connected, false otherwise
 * 
 * Business Rules:
 * 1. If users are connected, they are automatically considered as following each other
 * 2. This means connected users will show "Following" button instead of "Follow" button
 * 3. No need to manually follow someone you're already connected with
 */
async function isFollowing(followerId, followingId) {
  try {
    // First check if there's a direct follow relationship
    const followQuery =
      'SELECT id FROM user_follows WHERE follower_id = $1 AND following_id = $2';
    const followResult = await pool.query(followQuery, [followerId, followingId]);

    if (followResult.rows.length > 0) {
      return true;
    }

    // If not directly following, check if they are connected
    // Connected users are automatically considered as following each other
    // This means UI will show "Following" button instead of "Follow" button
    const connectionQuery = `
      SELECT id FROM user_connections 
      WHERE (user_id_1 = $1 AND user_id_2 = $2) 
         OR (user_id_1 = $2 AND user_id_2 = $1)
    `;
    const connectionResult = await pool.query(connectionQuery, [followerId, followingId]);

    if (connectionResult.rows.length > 0) {
      console.log(`[isFollowing] Users ${followerId.substring(0, 8)}... and ${followingId.substring(0, 8)}... are connected, returning true (auto-follow)`);
      return true;
    }

    return false;
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

    // IMPORTANT: Check if users are already connected in user_connections table
    // This is the source of truth for actual connections
    const checkConnectionQuery = `
      SELECT id FROM user_connections 
      WHERE (user_id_1 = $1 AND user_id_2 = $2) 
         OR (user_id_1 = $2 AND user_id_2 = $1)
    `;
    const connectionCheck = await dbClient.query(checkConnectionQuery, [
      requesterId,
      receiverId,
    ]);

    if (connectionCheck.rows.length > 0) {
      await dbClient.query('ROLLBACK');
      console.log(`[sendConnectionRequest] Users ${requesterId.substring(0, 8)}... and ${receiverId.substring(0, 8)}... are already connected`);
      return { success: false, message: 'Already connected' };
    }

    // Check for pending connection requests
    const checkRequestQuery = `
      SELECT id, status FROM connection_requests 
      WHERE (requester_id = $1 AND receiver_id = $2) 
         OR (requester_id = $2 AND receiver_id = $1)
    `;
    const requestCheck = await dbClient.query(checkRequestQuery, [
      requesterId,
      receiverId,
    ]);

    if (requestCheck.rows.length > 0) {
      const existing = requestCheck.rows[0];
      if (existing.status === 'pending') {
        await dbClient.query('ROLLBACK');
        console.log(`[sendConnectionRequest] Connection request already pending between ${requesterId.substring(0, 8)}... and ${receiverId.substring(0, 8)}...`);
        return {
          success: false,
          message: 'Connection request already pending',
        };
      }
      // If status is 'accepted' but no connection exists, allow creating a new request
      // This handles data inconsistency where request is accepted but connection wasn't created
      if (existing.status === 'accepted') {
        console.warn(`[sendConnectionRequest] Found accepted request but no connection exists. Allowing new request.`);
        // Continue to create a new request - this will overwrite the old one
      }
    }

    // Note: Connection requests are independent of follow status
    // Users can connect even if they're already following each other

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
    try {
      await dbClient.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
    if (error.code === '23505') {
      return { success: false, message: 'Connection request already exists' };
    }
    console.error('Error sending connection request:', error);
    throw error;
  } finally {
    if (dbClient) {
      try {
        dbClient.release();
      } catch (releaseError) {
        console.error('Error releasing database connection:', releaseError);
      }
    }
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

    // Create mutual follows only if they don't already exist (for backward compatibility and feed purposes)
    // Connections are separate from follows, so we don't update follower counts here
    const followId1 = uuidv4();
    const followId2 = uuidv4();

    // Check if follows already exist before inserting
    const checkFollow1Query = `
      SELECT id FROM user_follows 
      WHERE follower_id = $1 AND following_id = $2
    `;
    const checkFollow2Query = `
      SELECT id FROM user_follows 
      WHERE follower_id = $1 AND following_id = $2
    `;

    const [follow1Check, follow2Check] = await Promise.all([
      dbClient.query(checkFollow1Query, [requesterId, receiverId]),
      dbClient.query(checkFollow2Query, [receiverId, requesterId]),
    ]);

    const follow1Exists = follow1Check.rows.length > 0;
    const follow2Exists = follow2Check.rows.length > 0;

    // Only insert follows that don't exist
    if (!follow1Exists) {
      const insertFollow1 = `
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
      // Only update counts if we created a new follow
      await dbClient.query(
        'UPDATE users SET following = following + 1 WHERE id = $1',
        [requesterId]
      );
      await dbClient.query(
        'UPDATE users SET followers = followers + 1 WHERE id = $1',
        [receiverId]
      );
    }

    if (!follow2Exists) {
      const insertFollow2 = `
        INSERT INTO user_follows (id, follower_id, following_id, follower_username, following_username, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `;
      await dbClient.query(insertFollow2, [
        followId2,
        receiverId,
        requesterId,
        receiverUsername,
        requesterUsername,
      ]);
      // Only update counts if we created a new follow
      await dbClient.query(
        'UPDATE users SET following = following + 1 WHERE id = $1',
        [receiverId]
      );
      await dbClient.query(
        'UPDATE users SET followers = followers + 1 WHERE id = $1',
        [requesterId]
      );
    }

    // Create connection entry in user_connections table
    // Normalize order: always store with user_id_1 < user_id_2 (lexicographically)
    const [normalizedUserId1, normalizedUserId2] =
      requesterId < receiverId
        ? [requesterId, receiverId]
        : [receiverId, requesterId];

    // Get full names for both users
    const normalizedUser1Name =
      normalizedUserId1 === requesterId
        ? requesterResult.rows[0].full_name || requesterUsername
        : receiverResult.rows[0].full_name || receiverUsername;
    const normalizedUser2Name =
      normalizedUserId2 === requesterId
        ? requesterResult.rows[0].full_name || requesterUsername
        : receiverResult.rows[0].full_name || receiverUsername;

    // Check if connection already exists before creating
    const checkExistingConnectionQuery = `
      SELECT id FROM user_connections 
      WHERE (user_id_1 = $1 AND user_id_2 = $2) 
         OR (user_id_1 = $2 AND user_id_2 = $1)
    `;
    const existingConnectionCheck = await dbClient.query(checkExistingConnectionQuery, [
      normalizedUserId1,
      normalizedUserId2,
    ]);

    if (existingConnectionCheck.rows.length > 0) {
      console.log(`[acceptConnectionRequest] Connection already exists between ${requesterId.substring(0, 8)}... and ${receiverId.substring(0, 8)}...`);
      // Connection already exists, just commit the request status update
      await dbClient.query('COMMIT');
    } else {
      // Create connection entry in user_connections table
      // Normalize order: always store with user_id_1 < user_id_2 (lexicographically)
      const connectionId = uuidv4();
      const insertConnectionQuery = `
        INSERT INTO user_connections (id, user_id_1, user_id_2, full_name_1, full_name_2, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (user_id_1, user_id_2) DO NOTHING
        RETURNING id
      `;
      const connectionResult = await dbClient.query(insertConnectionQuery, [
        connectionId,
        normalizedUserId1,
        normalizedUserId2,
        normalizedUser1Name,
        normalizedUser2Name,
      ]);

      if (connectionResult.rows.length === 0) {
        console.warn(`[acceptConnectionRequest] Failed to create connection (possibly due to conflict) between ${requesterId.substring(0, 8)}... and ${receiverId.substring(0, 8)}...`);
      } else {
        console.log(`[acceptConnectionRequest] Connection created successfully: ${connectionResult.rows[0].id} between ${requesterId.substring(0, 8)}... and ${receiverId.substring(0, 8)}...`);
      }

      // Note: Connection counts are separate from follower counts
      // Connections don't affect the followers/following counts in the users table

      await dbClient.query('COMMIT');
    }

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
    try {
      await dbClient.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
    console.error('Error accepting connection request:', error);
    throw error;
  } finally {
    if (dbClient) {
      try {
        dbClient.release();
      } catch (releaseError) {
        console.error('Error releasing database connection:', releaseError);
      }
    }
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
    try {
      await dbClient.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
    console.error('Error rejecting connection request:', error);
    throw error;
  } finally {
    if (dbClient) {
      try {
        dbClient.release();
      } catch (releaseError) {
        console.error('Error releasing database connection:', releaseError);
      }
    }
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
    // First check if they are already connected
    const isConnectedResult = await isConnected(requesterId, receiverId);
    if (isConnectedResult) {
      return { exists: true, status: 'connected' };
    }

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
      return { exists: true, status: status };
    }

    return { exists: false, status: null };
  } catch (error) {
    console.error('Error checking connection request status:', error);
    throw error;
  }
}

/**
 * Check if two users are connected
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {Promise<boolean>} True if connected, false otherwise
 */
async function isConnected(userId1, userId2) {
  try {
    const query = `
      SELECT id 
      FROM user_connections 
      WHERE (user_id_1 = $1 AND user_id_2 = $2) 
         OR (user_id_1 = $2 AND user_id_2 = $1)
      LIMIT 1
    `;
    const result = await pool.query(query, [userId1, userId2]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking connection:', error);
    throw error;
  }
}

/**
 * Get list of connected users for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of connected user data
 */
async function getConnections(userId) {
  const query = `
    SELECT 
      u.id,
      u.username,
      u.full_name,
      u.user_type,
      u.profile_url,
      uc.created_at
    FROM users u
    INNER JOIN user_connections uc ON (
      (uc.user_id_1 = $1 AND uc.user_id_2 = u.id) OR
      (uc.user_id_2 = $1 AND uc.user_id_1 = u.id)
    )
    WHERE u.id != $1
    ORDER BY uc.created_at DESC
  `;

  try {
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching connections:', error);
    throw error;
  }
}

/**
 * Create a connection between two users
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {Promise<boolean>} True if connection was created, false if already connected
 */
async function createConnection(userId1, userId2) {
  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

    // Check if already connected
    const checkQuery = `
      SELECT id 
      FROM user_connections 
      WHERE (user_id_1 = $1 AND user_id_2 = $2) 
         OR (user_id_1 = $2 AND user_id_2 = $1)
    `;
    const checkResult = await dbClient.query(checkQuery, [userId1, userId2]);

    if (checkResult.rows.length > 0) {
      await dbClient.query('ROLLBACK');
      return false;
    }

    // Normalize order: always store with user_id_1 < user_id_2 (lexicographically)
    // This ensures consistent storage and prevents duplicates
    const [normalizedUserId1, normalizedUserId2] =
      userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

    // Get full names for both users
    const userQuery = 'SELECT full_name, username FROM users WHERE id = $1';
    const [user1Result, user2Result] = await Promise.all([
      dbClient.query(userQuery, [normalizedUserId1]),
      dbClient.query(userQuery, [normalizedUserId2]),
    ]);

    const fullName1 =
      user1Result.rows[0]?.full_name || user1Result.rows[0]?.username || null;
    const fullName2 =
      user2Result.rows[0]?.full_name || user2Result.rows[0]?.username || null;

    const id = uuidv4();
    const insertQuery = `
      INSERT INTO user_connections (id, user_id_1, user_id_2, full_name_1, full_name_2, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `;
    await dbClient.query(insertQuery, [
      id,
      normalizedUserId1,
      normalizedUserId2,
      fullName1,
      fullName2,
    ]);

    await dbClient.query('COMMIT');
    return true;
  } catch (error) {
    try {
      await dbClient.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
    // If it's a unique constraint violation, connection already exists
    if (error.code === '23505') {
      return false;
    }
    console.error('Error creating connection:', error);
    throw error;
  } finally {
    if (dbClient) {
      try {
        dbClient.release();
      } catch (releaseError) {
        console.error('Error releasing database connection:', releaseError);
      }
    }
  }
}

/**
 * Remove a connection between two users
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {Promise<boolean>} True if connection was removed, false if not connected
 */
async function removeConnection(userId1, userId2) {
  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

    const deleteQuery = `
      DELETE FROM user_connections 
      WHERE (user_id_1 = $1 AND user_id_2 = $2) 
         OR (user_id_1 = $2 AND user_id_2 = $1)
    `;
    const result = await dbClient.query(deleteQuery, [userId1, userId2]);

    await dbClient.query('COMMIT');
    return result.rowCount > 0;
  } catch (error) {
    try {
      await dbClient.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
    console.error('Error removing connection:', error);
    throw error;
  } finally {
    if (dbClient) {
      try {
        dbClient.release();
      } catch (releaseError) {
        console.error('Error releasing database connection:', releaseError);
      }
    }
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
  isConnected,
  getConnections,
  createConnection,
  removeConnection,
};

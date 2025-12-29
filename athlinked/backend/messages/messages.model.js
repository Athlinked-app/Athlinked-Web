const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function getOrCreateConversation(userId1, userId2, client = null) {
  const dbClient = client || pool;

  try {
    const checkQuery = `
      SELECT c.id
      FROM conversations c
      INNER JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
      INNER JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
      WHERE cp1.user_id = $1 AND cp2.user_id = $2
        AND cp1.user_id != cp2.user_id
      LIMIT 1
    `;

    const checkResult = await dbClient.query(checkQuery, [userId1, userId2]);

    if (checkResult.rows.length > 0) {
      return { id: checkResult.rows[0].id };
    }

    const conversationId = uuidv4();
    const createConversationQuery = `
      INSERT INTO conversations (id, last_message, last_message_at, created_at)
      VALUES ($1, NULL, NULL, NOW())
      RETURNING *
    `;

    await dbClient.query(createConversationQuery, [conversationId]);

    const userQuery = 'SELECT id, full_name, username FROM users WHERE id = $1';
    const [user1Result, user2Result] = await Promise.all([
      dbClient.query(userQuery, [userId1]),
      dbClient.query(userQuery, [userId2]),
    ]);
    
    const user1Name = user1Result.rows.length > 0 
      ? (user1Result.rows[0].full_name || user1Result.rows[0].username || 'User')
      : 'User';
    const user2Name = user2Result.rows.length > 0 
      ? (user2Result.rows[0].full_name || user2Result.rows[0].username || 'User')
      : 'User';

    const participant1Id = uuidv4();
    const participant2Id = uuidv4();

    const insertParticipantQuery = `
      INSERT INTO conversation_participants (id, conversation_id, user_id, user_name, unread_count, created_at)
      VALUES ($1, $2, $3, $4, 0, NOW())
      ON CONFLICT (conversation_id, user_id) 
      DO UPDATE SET user_name = EXCLUDED.user_name
    `;

    await dbClient.query(insertParticipantQuery, [participant1Id, conversationId, userId1, user1Name]);
    await dbClient.query(insertParticipantQuery, [participant2Id, conversationId, userId2, user2Name]);

    return { id: conversationId };
  } catch (error) {
    console.error('Error in getOrCreateConversation model:', error);
    console.error('Error details:', {
      userId1,
      userId2,
      message: error.message,
      code: error.code,
      detail: error.detail,
    });
    throw error;
  }
}

async function createMessage(conversationId, senderId, message, client = null, mediaUrl = null, messageType = 'text', postData = null) {
  const dbClient = client || pool;
  
  const userQuery = 'SELECT full_name, username FROM users WHERE id = $1';
  const userResult = await dbClient.query(userQuery, [senderId]);
  const senderName = userResult.rows.length > 0 
    ? (userResult.rows[0].full_name || userResult.rows[0].username || 'User')
    : 'User';
  
  const checkColumnsQuery = `
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name IN ('media_url', 'message_type', 'post_data')
  `;
  const columnsResult = await dbClient.query(checkColumnsQuery);
  const hasMediaUrl = columnsResult.rows.some(row => row.column_name === 'media_url');
  const hasMessageType = columnsResult.rows.some(row => row.column_name === 'message_type');
  const hasPostData = columnsResult.rows.some(row => row.column_name === 'post_data');
  
  const messageId = uuidv4();
  const postDataJson = postData ? (typeof postData === 'string' ? postData : JSON.stringify(postData)) : null;
  
  if (hasMediaUrl && hasMessageType && hasPostData) {
    const query = `
      INSERT INTO messages (id, conversation_id, sender_id, sender_name, message, media_url, message_type, post_data, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `;
    const values = [messageId, conversationId, senderId, senderName, message, mediaUrl, messageType, postDataJson];
    const result = await dbClient.query(query, values);
    return {
      ...result.rows[0],
      post_data: result.rows[0].post_data ? (typeof result.rows[0].post_data === 'string' ? JSON.parse(result.rows[0].post_data) : result.rows[0].post_data) : null,
    };
  } else if (hasMediaUrl && hasMessageType) {
    const query = `
      INSERT INTO messages (id, conversation_id, sender_id, sender_name, message, media_url, message_type, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `;
    const values = [messageId, conversationId, senderId, senderName, message, mediaUrl, messageType];
    const result = await dbClient.query(query, values);
    return {
      ...result.rows[0],
      post_data: postDataJson ? (typeof postDataJson === 'string' ? JSON.parse(postDataJson) : postDataJson) : null,
    };
  } else {
    const query = `
      INSERT INTO messages (id, conversation_id, sender_id, sender_name, message, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    const values = [messageId, conversationId, senderId, senderName, message];
    const result = await dbClient.query(query, values);
    return {
      ...result.rows[0],
      media_url: null,
      message_type: 'text',
      post_data: postDataJson ? (typeof postDataJson === 'string' ? JSON.parse(postDataJson) : postDataJson) : null,
    };
  }
}

/**
 * Update conversation last message
 * @param {string} conversationId - Conversation ID
 * @param {string} lastMessage - Last message text
 * @param {object} client - Optional database client for transactions
 */
async function updateConversationLastMessage(conversationId, lastMessage, client = null) {
  const query = `
    UPDATE conversations
    SET last_message = $1, last_message_at = NOW()
    WHERE id = $2
  `;

  const dbClient = client || pool;
  await dbClient.query(query, [lastMessage, conversationId]);
}

async function incrementUnreadCount(conversationId, userId, client = null) {
  const query = `
    UPDATE conversation_participants
    SET unread_count = unread_count + 1
    WHERE conversation_id = $1 AND user_id = $2
  `;

  const dbClient = client || pool;
  await dbClient.query(query, [conversationId, userId]);
}

/**
 * Get conversations for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of conversation data
 */
async function getConversationsForUser(userId) {
  const query = `
    SELECT 
      c.id as conversation_id,
      c.last_message,
      c.last_message_at as last_message_time,
      other_user.id as other_user_id,
      COALESCE(other_cp.user_name, other_user.full_name, 'User') as other_user_username,
      other_user.profile_url as other_user_profile_image,
      cp.unread_count
    FROM conversations c
    INNER JOIN conversation_participants cp ON c.id = cp.conversation_id
    INNER JOIN conversation_participants other_cp ON c.id = other_cp.conversation_id
    INNER JOIN users other_user ON other_cp.user_id = other_user.id
    WHERE cp.user_id = $1
      AND other_cp.user_id != $1
    ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
  `;

  const result = await pool.query(query, [userId]);
  return result.rows;
}

/**
 * Get messages for a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID (to check read status)
 * @returns {Promise<Array>} Array of message data
 */
async function getMessagesForConversation(conversationId, userId) {
  const otherUserQuery = `
    SELECT user_id
    FROM conversation_participants
    WHERE conversation_id = $1 AND user_id != $2
    LIMIT 1
  `;
  const otherUserResult = await pool.query(otherUserQuery, [conversationId, userId]);
  const otherUserId = otherUserResult.rows.length > 0 ? otherUserResult.rows[0].user_id : null;

  const checkColumnsQuery = `
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name IN ('media_url', 'message_type', 'post_data')
  `;
  const columnsResult = await pool.query(checkColumnsQuery);
  const hasMediaUrl = columnsResult.rows.some(row => row.column_name === 'media_url');
  const hasMessageType = columnsResult.rows.some(row => row.column_name === 'message_type');
  const hasPostData = columnsResult.rows.some(row => row.column_name === 'post_data');

  const mediaUrlSelect = hasMediaUrl ? 'm.media_url,' : 'NULL as media_url,';
  const messageTypeSelect = hasMessageType ? 'm.message_type,' : 'NULL as message_type,';
  const postDataSelect = hasPostData ? 'm.post_data,' : 'NULL as post_data,';

  const query = `
    SELECT 
      m.id as message_id,
      m.sender_id,
      COALESCE(m.sender_name, u.full_name, u.username, 'User') as sender_name,
      m.message,
      ${mediaUrlSelect}
      ${messageTypeSelect}
      ${postDataSelect}
      m.created_at,
      -- is_read: true if current user has read this message (for received messages)
      CASE WHEN mr.id IS NOT NULL THEN true ELSE false END as is_read,
      -- is_read_by_recipient: true if the recipient has read the message
      -- For messages sent by current user: check if read by other user
      -- For messages received by current user: always false (we don't track if sender read our messages)
      CASE 
        WHEN m.sender_id = $2 AND $3 IS NOT NULL THEN 
          CASE WHEN mr_other.id IS NOT NULL THEN true ELSE false END
        ELSE 
          false
      END as is_read_by_recipient
    FROM messages m
    LEFT JOIN users u ON m.sender_id = u.id
    LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = $2
    LEFT JOIN message_reads mr_other ON m.id = mr_other.message_id AND mr_other.user_id = $3
    WHERE m.conversation_id = $1
    ORDER BY m.created_at ASC
  `;

  const result = await pool.query(query, [conversationId, userId, otherUserId]);
  return result.rows;
}

/**
 * Mark messages as read
 * @param {string} conversationId - Conversation ID
 * @param {string} readerId - User ID who is reading
 * @param {string} senderId - User ID who sent the messages
 * @param {object} client - Optional database client for transactions
 */
async function markMessagesAsRead(conversationId, readerId, senderId, client = null) {
  const dbClient = client || pool;

  const unreadMessagesQuery = `
    SELECT m.id
    FROM messages m
    WHERE m.conversation_id = $1
      AND m.sender_id = $2
      AND NOT EXISTS (
        SELECT 1 FROM message_reads mr
        WHERE mr.message_id = m.id AND mr.user_id = $3
      )
  `;

  const unreadResult = await dbClient.query(unreadMessagesQuery, [
    conversationId,
    senderId,
    readerId,
  ]);

  if (unreadResult.rows.length > 0) {
    const insertReadQuery = `
      INSERT INTO message_reads (id, message_id, user_id, read_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (message_id, user_id) DO NOTHING
    `;

    for (const row of unreadResult.rows) {
      const readId = uuidv4();
      await dbClient.query(insertReadQuery, [readId, row.id, readerId]);
    }
  }

  const resetUnreadQuery = `
    UPDATE conversation_participants
    SET unread_count = 0
    WHERE conversation_id = $1 AND user_id = $2
  `;

  await dbClient.query(resetUnreadQuery, [conversationId, readerId]);
}

async function getSenderIdForConversation(conversationId, currentUserId) {
  const query = `
    SELECT user_id
    FROM conversation_participants
    WHERE conversation_id = $1 AND user_id != $2
    LIMIT 1
  `;

  const result = await pool.query(query, [conversationId, currentUserId]);
  return result.rows.length > 0 ? result.rows[0].user_id : null;
}

async function searchNetworkUsers(userId, searchQuery) {
  const followingQuery = `
    SELECT 
      u.id,
      u.username,
      u.full_name,
      u.profile_url,
      'following' as relationship
    FROM users u
    INNER JOIN user_follows uf ON u.id = uf.following_id
    WHERE uf.follower_id = $1
      AND u.id != $1
      AND (
        (u.username IS NOT NULL AND LOWER(u.username) LIKE LOWER($2))
        OR (u.full_name IS NOT NULL AND LOWER(u.full_name) LIKE LOWER($2))
      )
  `;

  const followersQuery = `
    SELECT 
      u.id,
      u.username,
      u.full_name,
      u.profile_url,
      'follower' as relationship
    FROM users u
    INNER JOIN user_follows uf ON u.id = uf.follower_id
    WHERE uf.following_id = $1
      AND u.id != $1
      AND (
        (u.username IS NOT NULL AND LOWER(u.username) LIKE LOWER($2))
        OR (u.full_name IS NOT NULL AND LOWER(u.full_name) LIKE LOWER($2))
      )
  `;

  try {
    const searchPattern = `%${searchQuery}%`;
    
    const [followingResult, followersResult] = await Promise.all([
      pool.query(followingQuery, [userId, searchPattern]),
      pool.query(followersQuery, [userId, searchPattern]),
    ]);

    const allUsers = new Map();
    
    followingResult.rows.forEach(user => {
      allUsers.set(user.id, user);
    });
    
    followersResult.rows.forEach(user => {
      if (!allUsers.has(user.id)) {
        allUsers.set(user.id, user);
      }
    });

    const result = Array.from(allUsers.values()).sort((a, b) => {
      if (a.relationship === 'following' && b.relationship === 'follower') return -1;
      if (a.relationship === 'follower' && b.relationship === 'following') return 1;
      const nameA = (a.full_name || a.username || '').toLowerCase();
      const nameB = (b.full_name || b.username || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return result.slice(0, 20);
  } catch (error) {
    console.error('Error in searchNetworkUsers:', error);
    console.error('Error details:', error.message, error.stack);
    throw error;
  }
}

async function updateUserNameInMessages(userId, userName) {
  const updateMessagesQuery = `
    UPDATE messages
    SET sender_name = $1
    WHERE sender_id = $2 AND (sender_name IS NULL OR sender_name != $1)
  `;
  
  const updateParticipantsQuery = `
    UPDATE conversation_participants
    SET user_name = $1
    WHERE user_id = $2 AND (user_name IS NULL OR user_name != $1)
  `;
  
  await Promise.all([
    pool.query(updateMessagesQuery, [userName, userId]),
    pool.query(updateParticipantsQuery, [userName, userId]),
  ]);
}

module.exports = {
  getOrCreateConversation,
  createMessage,
  updateConversationLastMessage,
  incrementUnreadCount,
  getConversationsForUser,
  getMessagesForConversation,
  markMessagesAsRead,
  getSenderIdForConversation,
  searchNetworkUsers,
  updateUserNameInMessages,
};


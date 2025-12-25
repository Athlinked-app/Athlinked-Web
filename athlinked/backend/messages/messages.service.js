const messagesModel = require('./messages.model');
const pool = require('../config/db');

/**
 * Send a message (creates conversation if needed)
 * @param {string} senderId - Sender user ID
 * @param {string} receiverId - Receiver user ID
 * @param {string} message - Message text
 * @returns {Promise<object>} Created message data
 */
async function sendMessage(senderId, receiverId, message) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get or create conversation
    const conversation = await messagesModel.getOrCreateConversation(
      senderId,
      receiverId,
      client
    );

    // Create message
    const createdMessage = await messagesModel.createMessage(
      conversation.id,
      senderId,
      message,
      client
    );

    // Update conversation last message
    await messagesModel.updateConversationLastMessage(
      conversation.id,
      message,
      client
    );

    // Increment unread count for receiver
    await messagesModel.incrementUnreadCount(
      conversation.id,
      receiverId,
      client
    );

    await client.query('COMMIT');

    return {
      ...createdMessage,
      conversation_id: conversation.id,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get conversations list for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of conversation data
 */
async function getConversations(userId) {
  return await messagesModel.getConversationsForUser(userId);
}

/**
 * Get messages for a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of message data
 */
async function getMessages(conversationId, userId) {
  return await messagesModel.getMessagesForConversation(conversationId, userId);
}

/**
 * Mark messages as read
 * @param {string} conversationId - Conversation ID
 * @param {string} readerId - User ID who is reading
 * @returns {Promise<object>} Result with senderId
 */
async function markAsRead(conversationId, readerId) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get sender ID (the other user in the conversation)
    const senderId = await messagesModel.getSenderIdForConversation(
      conversationId,
      readerId
    );

    if (!senderId) {
      throw new Error('Conversation not found or invalid');
    }

    // Mark messages as read
    await messagesModel.markMessagesAsRead(
      conversationId,
      readerId,
      senderId,
      client
    );

    await client.query('COMMIT');

    return { senderId };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Search network users (followers and following)
 * @param {string} userId - User ID
 * @param {string} searchQuery - Search query
 * @returns {Promise<Array>} Array of user data
 */
async function searchNetworkUsers(userId, searchQuery) {
  if (!searchQuery || searchQuery.trim().length === 0) {
    return [];
  }
  return await messagesModel.searchNetworkUsers(userId, searchQuery.trim());
}

/**
 * Get or create a conversation with another user
 * @param {string} userId - Current user ID
 * @param {string} otherUserId - Other user ID
 * @returns {Promise<object>} Conversation data
 */
async function getOrCreateConversation(userId, otherUserId) {
  try {
    const conversation = await messagesModel.getOrCreateConversation(
      userId,
      otherUserId
    );
    
    // Get the full conversation data - refresh the list to get the newly created conversation
    const conversations = await messagesModel.getConversationsForUser(userId);
    const foundConv = conversations.find(
      (conv) => conv.conversation_id === conversation.id
    );
    
    if (foundConv) {
      return foundConv;
    }
    
    // If not found in conversations list (newly created conversation), get other user's info and return structure
    const pool = require('../config/db');
    const userQuery = 'SELECT id, username, full_name, profile_url FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [otherUserId]);
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const otherUser = userResult.rows[0];
    
    return {
      conversation_id: conversation.id,
      other_user_id: otherUser.id,
      other_user_username: otherUser.username || otherUser.full_name || 'User',
      other_user_profile_image: otherUser.profile_url,
      last_message: null,
      last_message_time: null,
      unread_count: 0,
    };
  } catch (error) {
    console.error('Error in getOrCreateConversation service:', error);
    throw error;
  }
}

module.exports = {
  sendMessage,
  getConversations,
  getMessages,
  markAsRead,
  searchNetworkUsers,
  getOrCreateConversation,
};


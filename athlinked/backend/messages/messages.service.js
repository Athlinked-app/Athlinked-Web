const messagesModel = require('./messages.model');
const pool = require('../config/db');

async function sendMessage(senderId, receiverId, message, mediaUrl = null, messageType = 'text', postData = null) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const conversation = await messagesModel.getOrCreateConversation(
      senderId,
      receiverId,
      client
    );

    const createdMessage = await messagesModel.createMessage(
      conversation.id,
      senderId,
      message,
      client,
      mediaUrl,
      messageType,
      postData
    );

    const lastMessageText = message || (mediaUrl ? (messageType === 'gif' ? 'GIF' : 'Media') : '');
    await messagesModel.updateConversationLastMessage(
      conversation.id,
      lastMessageText,
      client
    );

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

async function getConversations(userId) {
  return await messagesModel.getConversationsForUser(userId);
}

async function getMessages(conversationId, userId) {
  return await messagesModel.getMessagesForConversation(conversationId, userId);
}

async function markAsRead(conversationId, readerId) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const senderId = await messagesModel.getSenderIdForConversation(
      conversationId,
      readerId
    );

    if (!senderId) {
      throw new Error('Conversation not found or invalid');
    }

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

async function searchNetworkUsers(userId, searchQuery) {
  if (!searchQuery || searchQuery.trim().length === 0) {
    return [];
  }
  return await messagesModel.searchNetworkUsers(userId, searchQuery.trim());
}

async function getOrCreateConversation(userId, otherUserId) {
  try {
    const conversation = await messagesModel.getOrCreateConversation(
      userId,
      otherUserId
    );
    
    const conversations = await messagesModel.getConversationsForUser(userId);
    const foundConv = conversations.find(
      (conv) => conv.conversation_id === conversation.id
    );
    
    if (foundConv) {
      return foundConv;
    }
    
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


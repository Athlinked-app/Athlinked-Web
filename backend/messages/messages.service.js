const messagesModel = require('./messages.model');
const { convertKeyToPresignedUrl } = require('../utils/s3');
const pool = require('../config/db');
const networkModel = require('../network/network.model');

async function sendMessage(
  senderId,
  receiverId,
  message,
  mediaUrl = null,
  messageType = 'text',
  postData = null
) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if users are connected before allowing message
    const isConnected = await networkModel.isConnected(senderId, receiverId);
    if (!isConnected) {
      await client.query('ROLLBACK');
      throw new Error('You can only send messages to connected users');
    }

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

    const lastMessageText =
      message || (mediaUrl ? (messageType === 'gif' ? 'GIF' : 'Media') : '');
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
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
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

async function getConversations(userId) {
  const conversations = await messagesModel.getConversationsForUser(userId);
  
  // Convert profile URLs to presigned URLs
  const conversationsWithPresignedUrls = await Promise.all(
    conversations.map(async (conv) => {
      if (conv.other_user_profile_image) {
        conv.other_user_profile_image = await convertKeyToPresignedUrl(conv.other_user_profile_image);
      }
      if (conv.media_url) {
        conv.media_url = await convertKeyToPresignedUrl(conv.media_url);
      }
      return conv;
    })
  );
  
  return conversationsWithPresignedUrls;
}

async function getMessages(conversationId, userId) {
  const messages = await messagesModel.getMessagesForConversation(conversationId, userId);
  
  // Convert profile URLs and media URLs to presigned URLs
  const messagesWithPresignedUrls = await Promise.all(
    messages.map(async (msg) => {
      if (msg.sender_profile_image) {
        msg.sender_profile_image = await convertKeyToPresignedUrl(msg.sender_profile_image);
      }
      if (msg.media_url) {
        msg.media_url = await convertKeyToPresignedUrl(msg.media_url);
      }
      return msg;
    })
  );
  
  return messagesWithPresignedUrls;
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
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
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

async function searchNetworkUsers(userId, searchQuery) {
  if (!searchQuery || searchQuery.trim().length === 0) {
    return [];
  }
  return await messagesModel.searchNetworkUsers(userId, searchQuery.trim());
}

async function getOrCreateConversation(userId, otherUserId) {
  try {
    // Check if users are connected before creating conversation
    const isConnected = await networkModel.isConnected(userId, otherUserId);
    if (!isConnected) {
      throw new Error('You can only create conversations with connected users');
    }

    const conversation = await messagesModel.getOrCreateConversation(
      userId,
      otherUserId
    );

    const conversations = await messagesModel.getConversationsForUser(userId);
    const foundConv = conversations.find(
      conv => conv.conversation_id === conversation.id
    );

    if (foundConv) {
      return foundConv;
    }

    const pool = require('../config/db');
    const userQuery =
      'SELECT id, username, full_name, profile_url FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [otherUserId]);

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const otherUser = userResult.rows[0];

    // Convert profile URL to presigned URL
    const profileImage = otherUser.profile_url 
      ? await convertKeyToPresignedUrl(otherUser.profile_url) 
      : null;

    return {
      conversation_id: conversation.id,
      other_user_id: otherUser.id,
      other_user_username: otherUser.username || otherUser.full_name || 'User',
      other_user_profile_image: profileImage,
      last_message: null,
      last_message_time: null,
      unread_count: 0,
    };
  } catch (error) {
    console.error('Error in getOrCreateConversation service:', error);
    throw error;
  }
}

async function deleteMessage(messageId, userId) {
  try {
    const result = await messagesModel.deleteMessage(messageId, userId);
    return result;
  } catch (error) {
    console.error('Error deleting message in service:', error);
    throw error;
  }
}

async function deleteConversation(conversationId, userId) {
  try {
    const result = await messagesModel.deleteConversation(
      conversationId,
      userId
    );
    return result;
  } catch (error) {
    console.error('Error deleting conversation in service:', error);
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
  deleteMessage,
  deleteConversation,
};

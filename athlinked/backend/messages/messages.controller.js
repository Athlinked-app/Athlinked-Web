const messagesService = require('./messages.service');
const upload = require('../utils/upload-message');
const path = require('path');

async function getConversations(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const conversations = await messagesService.getConversations(userId);

    res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

async function getMessages(req, res) {
  try {
    const userId = req.user?.id;
    const { conversationId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required',
      });
    }

    const messages = await messagesService.getMessages(conversationId, userId);

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

async function markAsRead(req, res) {
  try {
    const userId = req.user?.id;
    const { conversationId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required',
      });
    }

    const result = await messagesService.markAsRead(conversationId, userId);

    const io = req.app.get('io');
    if (io) {
      // Emit to sender that messages were read
      if (result.senderId) {
        io.to(`user:${result.senderId}`).emit('messages_read', {
          conversationId,
          readerId: userId,
        });
      }

      // Get updated conversation for the reader
      const updatedConversations = await messagesService.getConversations(userId);
      const updatedConv = updatedConversations.find(
        (c) => c.conversation_id === conversationId
      );

      // Emit conversation update to reader
      if (updatedConv) {
        io.to(`user:${userId}`).emit('conversation_updated', {
          conversation: updatedConv,
        });
      }

      // Get total unread count for reader
      const totalUnreadCount = updatedConversations.reduce(
        (sum, conv) => sum + (conv.unread_count || 0),
        0
      );

      // Emit total unread count update to reader
      io.to(`user:${userId}`).emit('message_count_update', {
        count: totalUnreadCount,
      });
    }

    res.json({
      success: true,
      senderId: result.senderId,
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

async function searchUsers(req, res) {
  try {
    const userId = req.user?.id;
    const { q } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    if (!q || q.trim().length === 0) {
      return res.json({
        success: true,
        users: [],
      });
    }

    const users = await messagesService.searchNetworkUsers(userId, q);

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Error searching users:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

async function getOrCreateConversation(req, res) {
  try {
    const userId = req.user?.id;
    const { otherUserId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - User ID required',
      });
    }

    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        message: 'Other user ID is required',
      });
    }

    const conversation = await messagesService.getOrCreateConversation(
      userId,
      otherUserId
    );

    res.json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

async function uploadMessageFile(req, res) {
  try {
    const uploadSingle = upload.single('file');

    uploadSingle(req, res, async err => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload failed',
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
      }

      const mediaUrl = `/uploads/messages/${req.file.filename}`;

      res.json({
        success: true,
        media_url: mediaUrl,
        filename: req.file.filename,
      });
    });
  } catch (error) {
    console.error('Error uploading message file:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

async function getUnreadCount(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const conversations = await messagesService.getConversations(userId);
    const totalUnreadCount = conversations.reduce(
      (sum, conv) => sum + (conv.unread_count || 0),
      0
    );

    res.json({
      success: true,
      unreadCount: totalUnreadCount,
      count: totalUnreadCount, // Alias for consistency
    });
  } catch (error) {
    console.error('Error getting unread message count:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

module.exports = {
  getConversations,
  getMessages,
  markAsRead,
  searchUsers,
  getOrCreateConversation,
  uploadMessageFile,
  getUnreadCount,
};

const messagesService = require('./messages.service');
const upload = require('../utils/upload-message');
const path = require('path');

async function getConversations(req, res) {
  try {
    const userId = req.user?.id || req.body.user_id || req.query.user_id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - User ID required',
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
    const userId = req.user?.id || req.body.user_id || req.query.user_id;
    const { conversationId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - User ID required',
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
    const userId = req.user?.id || req.body.user_id || req.query.user_id;
    const { conversationId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - User ID required',
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
    if (io && result.senderId) {
      io.to(`user:${result.senderId}`).emit('messages_read', {
        conversationId,
        readerId: userId,
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
    const userId = req.user?.id || req.body.user_id || req.query.user_id;
    const { q } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - User ID required',
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
    const userId = req.user?.id || req.body.user_id;
    const { otherUserId } = req.body;

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
    
    uploadSingle(req, res, async (err) => {
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

module.exports = {
  getConversations,
  getMessages,
  markAsRead,
  searchUsers,
  getOrCreateConversation,
  uploadMessageFile,
};


const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const messagesController = require('./messages.controller');

router.get(
  '/conversations',
  authenticateToken,
  messagesController.getConversations
);
router.post(
  '/conversations/create',
  authenticateToken,
  messagesController.getOrCreateConversation
);
router.get('/search/users', authenticateToken, messagesController.searchUsers);
router.post(
  '/:conversationId/read',
  authenticateToken,
  messagesController.markAsRead
);
router.post('/upload', authenticateToken, messagesController.uploadMessageFile);
router.get(
  '/:conversationId',
  authenticateToken,
  messagesController.getMessages
);

module.exports = router;

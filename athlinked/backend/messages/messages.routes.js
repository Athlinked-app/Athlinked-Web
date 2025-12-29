const express = require('express');
const router = express.Router();
const messagesController = require('./messages.controller');

router.get('/conversations', messagesController.getConversations);
router.post('/conversations/create', messagesController.getOrCreateConversation);
router.get('/search/users', messagesController.searchUsers);
router.post('/:conversationId/read', messagesController.markAsRead);
router.post('/upload', messagesController.uploadMessageFile);
router.get('/:conversationId', messagesController.getMessages);

module.exports = router;


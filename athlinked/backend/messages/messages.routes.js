const express = require('express');
const router = express.Router();
const messagesController = require('./messages.controller');

/**
 * GET /api/messages/conversations
 * Get conversations list for current user
 */
router.get('/conversations', messagesController.getConversations);

/**
 * POST /api/messages/conversations/create
 * Get or create a conversation with another user
 */
router.post('/conversations/create', messagesController.getOrCreateConversation);

/**
 * GET /api/messages/search/users?q=searchQuery
 * Search users from network (followers and following)
 * NOTE: This must come before /:conversationId to avoid route conflicts
 */
router.get('/search/users', messagesController.searchUsers);

/**
 * POST /api/messages/:conversationId/read
 * Mark messages as read
 * NOTE: This must come before /:conversationId to avoid route conflicts
 */
router.post('/:conversationId/read', messagesController.markAsRead);

/**
 * GET /api/messages/:conversationId
 * Get messages for a conversation
 * NOTE: This must be last as it matches any string
 */
router.get('/:conversationId', messagesController.getMessages);

module.exports = router;


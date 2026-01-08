console.log('ENV CHECK - JWT_SECRET:', process.env.JWT_SECRET);
console.log('ENV CHECK - JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET);
const app = require('./app');
const { Server } = require('socket.io');
const http = require('http');
require('dotenv').config();

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', socket => {
  let socketUserId = null;

  socket.on('userId', data => {
    const { userId } = data;
    if (userId) {
      socketUserId = userId;
      socket.userId = userId;
      socket.join(`user:${userId}`);
    }
  });

  socket.on('send_message', async data => {
    try {
      const {
        conversationId,
        receiverId,
        message,
        media_url,
        message_type,
        post_data,
      } = data;

      if (
        !conversationId ||
        !receiverId ||
        (!message && !media_url && !post_data)
      ) {
        socket.emit('error', { message: 'Missing required fields' });
        return;
      }

      const senderId = socket.userId || socketUserId;
      if (!senderId) {
        socket.emit('error', {
          message: 'User not authenticated. Please send userId first.',
        });
        return;
      }

      const messagesService = require('./messages/messages.service');

      const createdMessage = await messagesService.sendMessage(
        senderId,
        receiverId,
        message || '',
        media_url || null,
        message_type || 'text',
        post_data || null
      );

      const receiverSockets = await io.in(`user:${receiverId}`).fetchSockets();
      const isReceiverOnline = receiverSockets.length > 0;

      // Get updated conversation data for both users
      const messagesModel = require('./messages/messages.model');
      const conversationsService = require('./messages/messages.service');

      // Get updated conversations for receiver
      const receiverConversations =
        await conversationsService.getConversations(receiverId);
      const updatedReceiverConv = receiverConversations.find(
        c => c.conversation_id === createdMessage.conversation_id
      );

      // Get updated conversations for sender
      const senderConversations =
        await conversationsService.getConversations(senderId);
      const updatedSenderConv = senderConversations.find(
        c => c.conversation_id === createdMessage.conversation_id
      );

      // Get total unread count for receiver
      const totalUnreadCount = receiverConversations.reduce(
        (sum, conv) => sum + (conv.unread_count || 0),
        0
      );

      // Emit to receiver
      io.to(`user:${receiverId}`).emit('receive_message', {
        message_id: createdMessage.id,
        conversation_id: createdMessage.conversation_id,
        sender_id: createdMessage.sender_id,
        message: createdMessage.message,
        media_url: createdMessage.media_url,
        message_type: createdMessage.message_type,
        post_data: createdMessage.post_data,
        created_at: createdMessage.created_at,
      });

      // Emit conversation update to receiver
      if (updatedReceiverConv) {
        io.to(`user:${receiverId}`).emit('conversation_updated', {
          conversation: updatedReceiverConv,
        });
      }

      // Emit total unread count update to receiver
      io.to(`user:${receiverId}`).emit('message_count_update', {
        count: totalUnreadCount,
      });

      if (isReceiverOnline) {
        socket.emit('message_delivered', {
          message_id: createdMessage.id,
          conversation_id: createdMessage.conversation_id,
        });
      }

      // Emit to sender
      socket.emit('receive_message', {
        message_id: createdMessage.id,
        conversation_id: createdMessage.conversation_id,
        sender_id: createdMessage.sender_id,
        message: createdMessage.message,
        media_url: createdMessage.media_url,
        message_type: createdMessage.message_type,
        post_data: createdMessage.post_data,
        created_at: createdMessage.created_at,
        is_delivered: isReceiverOnline,
      });

      // Emit conversation update to sender
      if (updatedSenderConv) {
        socket.emit('conversation_updated', {
          conversation: updatedSenderConv,
        });
      }
    } catch (error) {
      console.error('Error handling send_message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User ${socketUserId || socket.userId} disconnected`);
  });
});

// Helper function to emit events to specific users
function emitToUser(userId, event, data) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

// Make io available globally for use in other modules
global.io = io;
global.emitToUser = emitToUser;

app.set('io', io);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Socket.IO server initialized`);
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.log(`💡 To kill the process on port ${PORT}, run:`);
    console.log(`   lsof -ti:${PORT} | xargs kill -9`);
    console.log(`   Or on Linux: kill -9 $(lsof -ti:${PORT})`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
    process.exit(1);
  }
});

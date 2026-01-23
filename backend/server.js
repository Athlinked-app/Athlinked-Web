// Load environment variables FIRST before anything else
require('dotenv').config();

// Test database connection before starting server
const pool = require('./config/db');
(async function testDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('⚠️ Server will start but database operations may fail');
    console.error('Please check your database configuration in .env file');
  }
})();

const app = require('./app');
const { Server } = require('socket.io');
const http = require('http');

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
});

io.on('connection', socket => {
  let socketUserId = null;
  socket.on('userId', (data, callback) => {
    try {
      const { userId } = data || {};
      if (userId) {
        socketUserId = userId;
        socket.userId = userId;
        socket.join(`user:${userId}`);
        // Send acknowledgment if callback provided
        if (typeof callback === 'function') {
          callback({ success: true, message: 'User ID registered' });
        }
      } else {
        if (typeof callback === 'function') {
          callback({ success: false, error: 'User ID is required' });
        }
      }
    } catch (error) {
      console.error('Error handling userId event:', error);
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message || 'Failed to register user ID' });
      }
      socket.emit('error', { message: 'Failed to register user ID' });
    }
  });

  socket.on('send_message', async data => {
    try {
      console.log('📨 Received send_message event:', {
        conversationId: data?.conversationId,
        receiverId: data?.receiverId,
        hasMessage: !!data?.message,
        hasMedia: !!data?.media_url,
        hasPostData: !!data?.post_data,
        socketId: socket.id,
        socketUserId: socket.userId || socketUserId,
      });

      const {
        conversationId,
        receiverId,
        message,
        media_url,
        message_type,
        post_data,
      } = data || {};

      if (
        !conversationId ||
        !receiverId ||
        (!message && !media_url && !post_data)
      ) {
        console.error('❌ Missing required fields in send_message', { data });
        socket.emit('error', { message: 'Missing required fields' });
        return;
      }

      const senderId = socket.userId || socketUserId;
      if (!senderId) {
        console.error('❌ User not authenticated in send_message', {
          socketUserId: socket.userId,
          socketUserIdVar: socketUserId,
        });
        socket.emit('error', {
          message: 'User not authenticated. Please send userId first.',
        });
        return;
      }

      console.log(`📤 Processing message from ${senderId} to ${receiverId}`);

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
      const _messagesModel = require('./messages/messages.model');
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
      console.log(`📤 Emitting receive_message to user:${receiverId}`);
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
      console.log(`📤 Emitting receive_message to sender:${senderId}`);
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

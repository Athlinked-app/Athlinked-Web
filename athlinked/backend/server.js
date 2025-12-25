const app = require('./app');
const { Server } = require('socket.io');
const http = require('http');
require('dotenv').config();

const PORT = process.env.PORT || 3001;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Store userId in socket data
  let socketUserId = null;

  // Handle userId on connection
  socket.on('userId', (data) => {
    const { userId } = data;
    if (userId) {
      socketUserId = userId;
      socket.userId = userId;
      // Join user-specific room
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined room user:${userId}`);
    }
  });

  // Handle send_message event
  socket.on('send_message', async (data) => {
    try {
      const { conversationId, receiverId, message } = data;

      if (!conversationId || !receiverId || !message) {
        socket.emit('error', { message: 'Missing required fields' });
        return;
      }

      // Get sender ID from socket
      const senderId = socket.userId || socketUserId;
      if (!senderId) {
        socket.emit('error', { message: 'User not authenticated. Please send userId first.' });
        return;
      }

      // Import messages service
      const messagesService = require('./messages/messages.service');

      // Send message using service
      const createdMessage = await messagesService.sendMessage(
        senderId,
        receiverId,
        message
      );

      // Check if receiver is online
      const receiverSockets = await io.in(`user:${receiverId}`).fetchSockets();
      const isReceiverOnline = receiverSockets.length > 0;

      // Emit to receiver
      io.to(`user:${receiverId}`).emit('receive_message', {
        message_id: createdMessage.id,
        conversation_id: createdMessage.conversation_id,
        sender_id: createdMessage.sender_id,
        message: createdMessage.message,
        created_at: createdMessage.created_at,
      });

      // Emit message delivered to sender if receiver is online
      if (isReceiverOnline) {
        socket.emit('message_delivered', {
          message_id: createdMessage.id,
          conversation_id: createdMessage.conversation_id,
        });
      }

      // Also emit back to sender for confirmation
      socket.emit('receive_message', {
        message_id: createdMessage.id,
        conversation_id: createdMessage.conversation_id,
        sender_id: createdMessage.sender_id,
        message: createdMessage.message,
        created_at: createdMessage.created_at,
        is_delivered: isReceiverOnline,
      });
    } catch (error) {
      console.error('Error handling send_message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available to other modules if needed
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

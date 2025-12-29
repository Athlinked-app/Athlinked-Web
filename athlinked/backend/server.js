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

io.on('connection', (socket) => {
  let socketUserId = null;

  socket.on('userId', (data) => {
    const { userId } = data;
    if (userId) {
      socketUserId = userId;
      socket.userId = userId;
      socket.join(`user:${userId}`);
    }
  });

  socket.on('send_message', async (data) => {
    try {
      const { conversationId, receiverId, message, media_url, message_type, post_data } = data;

      if (!conversationId || !receiverId || (!message && !media_url && !post_data)) {
        socket.emit('error', { message: 'Missing required fields' });
        return;
      }

      const senderId = socket.userId || socketUserId;
      if (!senderId) {
        socket.emit('error', { message: 'User not authenticated. Please send userId first.' });
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

      if (isReceiverOnline) {
        socket.emit('message_delivered', {
          message_id: createdMessage.id,
          conversation_id: createdMessage.conversation_id,
        });
      }

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
    } catch (error) {
      console.error('Error handling send_message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
  });
});

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

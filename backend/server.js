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

// Test Firebase Admin SDK initialization (non-blocking)
(async function testFirebaseConnection() {
  try {
    const admin = require('./config/firebase');
    if (admin.isInitialized && admin.isInitialized()) {
      console.log('✅ Firebase Admin SDK is ready for push notifications');
    }
    // Don't log warnings if Firebase is not configured - it's optional
  } catch (error) {
    // Silently handle Firebase initialization errors - it's optional
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

      // Log createdMessage structure for debugging
      console.log('📝 Created message structure:', {
        id: createdMessage.id,
        sender_id: createdMessage.sender_id,
        sender_name: createdMessage.sender_name,
        senderName: createdMessage.senderName,
        message: createdMessage.message?.substring(0, 50)
      });

      // Send push notification to receiver
      console.log('🔔 Starting push notification process for receiver:', receiverId);
      try {
        const pool = require('./config/db');
        const admin = require('./config/firebase');
        
        // DEBUG MODE: Set to true to see notification payload even when Firebase isn't initialized
        const DEBUG_NOTIFICATION_PAYLOAD = process.env.NODE_ENV === 'development';
        const firebaseInitialized = admin.isInitialized && admin.isInitialized();
        
        // Verify Firebase Admin is initialized
        if (!firebaseInitialized) {
          // Firebase not configured
          if (DEBUG_NOTIFICATION_PAYLOAD) {
            console.log('⚠️ Firebase not initialized - but running in DEBUG MODE to see payload');
            console.log('🔍 DEBUG MODE: Will simulate notification payload creation');
          } else {
            console.log('⚠️ Firebase not initialized - skipping push notification');
            return; // Skip notification code entirely
          }
        } else {
          console.log('✅ Firebase Admin SDK is initialized');
        }
        
        // Continue with notification logic (either Firebase is initialized OR we're in debug mode)
        
        // Query fcm_tokens table for receiver's tokens
        console.log('🔍 Querying fcm_tokens table for receiverId:', receiverId);
        const tokensQuery = `
          SELECT token, platform
          FROM fcm_tokens
          WHERE user_id = $1
          ORDER BY updated_at DESC
        `;
        const tokensResult = await pool.query(tokensQuery, [receiverId]);
        const tokens = tokensResult.rows.map(row => row.token);
        const platforms = tokensResult.rows.map(row => row.platform);
        
        console.log('📊 Token query result:', {
          rowCount: tokensResult.rows.length,
          tokensFound: tokens.length,
          platforms: platforms
        });
        
        if (tokens.length > 0) {
          console.log('✅ Tokens found:', tokens.length);
          console.log('📱 Platforms:', platforms);
          
          // Get sender's full name for notification title
          // Use the SAME query pattern that works for logging (proven to work)
          let senderName = 'New Message'; // Fallback title if name query fails
          
          console.log('\n═══════════════════════════════════════════════════════════');
          console.log('🔍 STEP 1: Starting sender name lookup for notification');
          console.log('═══════════════════════════════════════════════════════════');
          console.log('📌 DEBUG: Sender ID (type:', typeof senderId, '):', senderId);
          console.log('📌 DEBUG: Sender ID stringified:', JSON.stringify(senderId));
          
          try {
            // Use the EXACT same query pattern as the logging code (which works)
            const senderQuery = `
              SELECT id, full_name, username
              FROM users
              WHERE id = $1
            `;
            
            console.log('📌 DEBUG: SQL Query:', senderQuery);
            console.log('📌 DEBUG: Query parameter array:', [senderId]);
            
            const senderResult = await pool.query(senderQuery, [senderId]);
            
            console.log('📌 DEBUG: Query executed successfully');
            console.log('📌 DEBUG: DB Result row count:', senderResult.rows.length);
            console.log('📌 DEBUG: Full DB Result:', JSON.stringify(senderResult.rows, null, 2));
            
            if (senderResult.rows.length > 0) {
              const row = senderResult.rows[0];
              console.log('📌 DEBUG: Row data:', {
                id: row.id,
                id_type: typeof row.id,
                full_name: row.full_name,
                full_name_type: typeof row.full_name,
                full_name_is_null: row.full_name === null,
                full_name_is_undefined: row.full_name === undefined,
                username: row.username,
                username_type: typeof row.username,
                username_is_null: row.username === null,
                username_is_undefined: row.username === undefined
              });
              
              // Use the EXACT same logic as logging code: full_name || username
              const name = row.full_name || row.username;
              
              console.log('📌 DEBUG: Name extraction:', {
                full_name_value: row.full_name,
                username_value: row.username,
                selectedName: name,
                selectedName_type: typeof name,
                selectedName_length: name ? name.length : 0
              });
              
              if (name && name.trim().length > 0) {
                senderName = name.trim();
                console.log('✅ STEP 1 SUCCESS: senderName assigned:', senderName);
                console.log('✅ STEP 1 SUCCESS: senderName type:', typeof senderName);
                console.log('✅ STEP 1 SUCCESS: senderName length:', senderName.length);
              } else {
                console.warn('⚠️ STEP 1 WARNING: Both full_name and username are empty/null');
                console.warn('⚠️ STEP 1 WARNING: name value:', name);
                senderName = 'New Message';
              }
            } else {
              console.error('❌ STEP 1 ERROR: User not found in database');
              console.error('❌ STEP 1 ERROR: senderId searched:', senderId);
              senderName = 'New Message';
            }
          } catch (nameError) {
            console.error('❌ STEP 1 EXCEPTION: Error fetching sender name');
            console.error('❌ STEP 1 EXCEPTION:', nameError.message);
            console.error('❌ STEP 1 EXCEPTION stack:', nameError.stack);
            senderName = 'New Message';
          }
          
          // Final validation
          console.log('\n📌 STEP 1 VALIDATION: Checking senderName before final assignment');
          console.log('📌 STEP 1 VALIDATION: senderName value:', senderName);
          console.log('📌 STEP 1 VALIDATION: senderName type:', typeof senderName);
          console.log('📌 STEP 1 VALIDATION: senderName === "Someone":', senderName === 'Someone');
          console.log('📌 STEP 1 VALIDATION: senderName === "New Message":', senderName === 'New Message');
          
          if (!senderName || senderName.trim().length === 0 || senderName === 'Someone') {
            console.warn('⚠️ STEP 1 VALIDATION FAILED: senderName is invalid');
            senderName = 'New Message';
          }
          
          console.log('👤 STEP 1 FINAL: senderName =', senderName);
          console.log('═══════════════════════════════════════════════════════════\n');
          
          // Prepare notification body - show the actual message content
          // For User 2, this should show User 1's message
          let notificationBody = '';
          
          // Handle different message types
          if (media_url) {
            // For media messages, show what type of media was sent
            const mediaTypeText = message_type === 'gif' ? 'Sent a GIF' : 
                                 message_type === 'image' ? 'Sent an image' :
                                 message_type === 'video' ? 'Sent a video' :
                                 message_type === 'file' ? 'Sent a file' : 'Sent media';
            
            // If there's also text with the media, prefer showing the text
            if (message && message.trim()) {
              notificationBody = message.trim();
            } else {
              notificationBody = mediaTypeText;
            }
          } else if (post_data) {
            // If there's text with the post, show it, otherwise show default
            if (message && message.trim()) {
              notificationBody = message.trim();
            } else {
              notificationBody = 'Shared a post';
            }
          } else {
            // Regular text message
            notificationBody = message || 'New message';
          }
          
          // Ensure notification body is never empty
          if (!notificationBody || notificationBody.trim().length === 0) {
            notificationBody = 'New message';
          }
          
          // Truncate message body to 100 characters (increased from 50 for better readability)
          if (notificationBody.length > 100) {
            notificationBody = notificationBody.substring(0, 97) + '...';
          }
          
          console.log('📨 Notification content:', {
            title: senderName,
            body: notificationBody,
            bodyLength: notificationBody.length,
            messageType: message_type,
            hasMedia: !!media_url,
            hasPost: !!post_data
          });
          
          // Validate notification payload before sending
          if (!senderName || senderName.trim().length === 0) {
            console.warn('⚠️ DEBUG: Sender name is empty before payload creation, using fallback');
            senderName = 'New Message';
          }
          
          if (!notificationBody || notificationBody.trim().length === 0) {
            console.warn('⚠️ DEBUG: Notification body is empty, using fallback');
            notificationBody = 'New message';
          }
          
          // Prepare data payload - FCM requires all values to be strings
          const dataPayload = {
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
            messageId: String(createdMessage.id),
            senderId: String(senderId),
            conversationId: String(createdMessage.conversation_id || ''),
            type: 'chat'
          };
          
          // Use senderName directly - it's already fetched using the proven working method
          console.log('\n═══════════════════════════════════════════════════════════');
          console.log('🔍 STEP 2: Creating finalTitle from senderName');
          console.log('═══════════════════════════════════════════════════════════');
          console.log('📌 STEP 2 INPUT: senderName =', senderName);
          console.log('📌 STEP 2 INPUT: senderName type =', typeof senderName);
          
          let finalTitle = senderName.trim();
          
          console.log('📌 STEP 2 OUTPUT: finalTitle =', finalTitle);
          console.log('📌 STEP 2 OUTPUT: finalTitle type =', typeof finalTitle);
          console.log('📌 STEP 2 OUTPUT: finalTitle length =', finalTitle.length);
          console.log('📌 STEP 2 CHECK: finalTitle === "New Message":', finalTitle === 'New Message');
          console.log('📌 STEP 2 CHECK: finalTitle === "Someone":', finalTitle === 'Someone');
          
          // CRITICAL CHECK: If title is still a fallback, something went wrong
          if (finalTitle === 'New Message' || finalTitle === 'Someone') {
            console.error('\n❌ STEP 2 ERROR: Notification title is still a fallback value!');
            console.error('❌ STEP 2 ERROR: senderName was:', senderName);
            console.error('❌ STEP 2 ERROR: finalTitle is:', finalTitle);
            console.error('❌ STEP 2 ERROR: This should not happen if sender name was fetched correctly');
            
            // Try one more time with a direct query
            console.log('🆘 STEP 2 EMERGENCY: Attempting emergency query...');
            try {
              const emergencyQuery = `SELECT full_name, username FROM users WHERE id = $1`;
              console.log('🆘 STEP 2 EMERGENCY: Query:', emergencyQuery);
              console.log('🆘 STEP 2 EMERGENCY: Parameter:', senderId);
              
              const emergencyResult = await pool.query(emergencyQuery, [senderId]);
              console.log('🆘 STEP 2 EMERGENCY: Result rows:', emergencyResult.rows.length);
              console.log('🆘 STEP 2 EMERGENCY: Result data:', JSON.stringify(emergencyResult.rows, null, 2));
              
              if (emergencyResult.rows.length > 0) {
                const emergencyName = emergencyResult.rows[0].full_name || emergencyResult.rows[0].username;
                console.log('🆘 STEP 2 EMERGENCY: Extracted name:', emergencyName);
                
                if (emergencyName && emergencyName.trim().length > 0) {
                  console.log('✅ STEP 2 EMERGENCY SUCCESS: Overriding with:', emergencyName);
                  finalTitle = emergencyName.trim();
                  console.log('✅ STEP 2 EMERGENCY SUCCESS: finalTitle now =', finalTitle);
                } else {
                  console.error('❌ STEP 2 EMERGENCY FAILED: Name is empty');
                }
              } else {
                console.error('❌ STEP 2 EMERGENCY FAILED: No rows returned');
              }
            } catch (e) {
              console.error('❌ STEP 2 EMERGENCY EXCEPTION:', e.message);
              console.error('❌ STEP 2 EMERGENCY EXCEPTION stack:', e.stack);
            }
          } else {
            console.log('✅ STEP 2 SUCCESS: finalTitle is valid:', finalTitle);
          }
          
          console.log('👤 STEP 2 FINAL: finalTitle =', finalTitle);
          console.log('═══════════════════════════════════════════════════════════\n');
          
          // CRITICAL: notification and data must be separate properties
          // notification is for display, data is for app navigation
          console.log('\n═══════════════════════════════════════════════════════════');
          console.log('🔍 STEP 3: Creating messagePayload object');
          console.log('═══════════════════════════════════════════════════════════');
          console.log('📌 STEP 3 INPUT: finalTitle =', finalTitle);
          console.log('📌 STEP 3 INPUT: finalTitle type =', typeof finalTitle);
          console.log('📌 STEP 3 INPUT: notificationBody =', notificationBody);
          
          // Add Android-specific configuration for background notifications
          const messagePayload = {
            tokens: tokens,
            notification: {
              title: finalTitle, // Use the verified sender's name from DB
              body: notificationBody.trim()
            },
            data: dataPayload,
            android: {
              priority: 'high',
              notification: {
                sound: 'default',
                channelId: 'chat_messages',
                priority: 'high',
                visibility: 'public'
              }
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                  badge: 1,
                  contentAvailable: true
                }
              }
            }
          };
          
          console.log('📌 STEP 3 OUTPUT: messagePayload.notification.title =', messagePayload.notification.title);
          console.log('📌 STEP 3 OUTPUT: messagePayload.notification.body =', messagePayload.notification.body);
          console.log('📌 STEP 3 CHECK: title === finalTitle:', messagePayload.notification.title === finalTitle);
          console.log('📌 STEP 3 CHECK: title === senderName:', messagePayload.notification.title === senderName);
          console.log('═══════════════════════════════════════════════════════════\n');
          
          console.log('📤 Sending push notification with payload:', {
            tokenCount: tokens.length,
            title: messagePayload.notification.title,
            body: messagePayload.notification.body,
            dataKeys: Object.keys(messagePayload.data),
            hasAndroidConfig: !!messagePayload.android,
            hasApnsConfig: !!messagePayload.apns
          });
          
          // Validate payload structure before sending
          if (!messagePayload.notification || !messagePayload.notification.title || !messagePayload.notification.body) {
            console.error('❌ Invalid notification payload structure');
            throw new Error('Invalid notification payload: missing title or body');
          }
          
          // DEBUG: Log right before sending notification
          console.log('\n═══════════════════════════════════════════════════════════');
          console.log('🔍 STEP 4: Final validation before sending');
          console.log('═══════════════════════════════════════════════════════════');
          console.log('📌 STEP 4: senderId =', senderId);
          console.log('📌 STEP 4: senderName =', senderName);
          console.log('📌 STEP 4: finalTitle =', finalTitle);
          console.log('📌 STEP 4: payloadTitle =', messagePayload.notification.title);
          console.log('📌 STEP 4: payloadBody =', messagePayload.notification.body);
          console.log('📌 STEP 4 CHECK: titleIsFallback =', messagePayload.notification.title === 'New Message' || messagePayload.notification.title === 'Someone');
          console.log('📌 STEP 4 CHECK: titleMatchesSenderName =', messagePayload.notification.title === senderName);
          console.log('📌 STEP 4 CHECK: titleMatchesFinalTitle =', messagePayload.notification.title === finalTitle);
          console.log('📌 STEP 4 CHECK: title === "Someone" =', messagePayload.notification.title === 'Someone');
          console.log('📌 STEP 4 CHECK: title === "New Message" =', messagePayload.notification.title === 'New Message');
          
          // CRITICAL CHECK: Verify the title matches what we expect
          if (messagePayload.notification.title === 'Someone' || messagePayload.notification.title === 'New Message') {
            console.error('\n❌ STEP 4 ERROR: Title is still a fallback value in payload!');
            console.error('❌ STEP 4 ERROR: senderName =', senderName);
            console.error('❌ STEP 4 ERROR: finalTitle =', finalTitle);
            console.error('❌ STEP 4 ERROR: payloadTitle =', messagePayload.notification.title);
            
            // Force override with senderName if it's not a fallback
            if (senderName && senderName !== 'New Message' && senderName !== 'Someone') {
              console.log('✅ STEP 4 FORCE OVERRIDE: Changing payload title from', messagePayload.notification.title, 'to', senderName);
              messagePayload.notification.title = senderName;
              console.log('✅ STEP 4 FORCE OVERRIDE: payloadTitle now =', messagePayload.notification.title);
            } else {
              console.error('❌ STEP 4 FORCE OVERRIDE FAILED: senderName is also invalid:', senderName);
            }
          } else {
            console.log('✅ STEP 4 SUCCESS: Title is valid:', messagePayload.notification.title);
          }
          
          console.log('📋 STEP 4 FINAL: Full payload structure:', JSON.stringify(messagePayload, null, 2));
          console.log('═══════════════════════════════════════════════════════════\n');
          
          // DEBUG MODE: If Firebase isn't initialized, don't actually send, just log
          if (!firebaseInitialized) {
            console.log('\n═══════════════════════════════════════════════════════════');
            console.log('⚠️ DEBUG MODE: Firebase not initialized - NOT sending notification');
            console.log('═══════════════════════════════════════════════════════════');
            console.log('📋 DEBUG MODE: Notification title would be:', messagePayload.notification.title);
            console.log('📋 DEBUG MODE: Notification body would be:', messagePayload.notification.body);
            console.log('📋 DEBUG MODE: Token count:', tokens.length);
            console.log('═══════════════════════════════════════════════════════════\n');
            return; // Exit early, don't try to send
          }
          
          console.log('📤 Actually sending notification via Firebase...');
          const response = await admin.messaging().sendMulticast(messagePayload);
          
          console.log('📊 Notification send result:', {
            successCount: response.successCount,
            failureCount: response.failureCount,
            totalTokens: tokens.length,
            responses: response.responses.map((r, idx) => ({
              index: idx,
              success: r.success,
              error: r.error ? {
                code: r.error.code,
                message: r.error.message
              } : null
            }))
          });
          
          // Handle invalid tokens (clean up from database)
          if (response.failureCount > 0) {
            const fcmTokensModel = require('./notifications/fcm-tokens.model');
            const invalidTokens = [];
            response.responses.forEach((resp, idx) => {
              if (!resp.success) {
                console.error(`❌ Token ${idx} failed:`, {
                  token: tokens[idx]?.substring(0, 20) + '...',
                  errorCode: resp.error?.code,
                  errorMessage: resp.error?.message
                });
                if (
                  resp.error?.code === 'messaging/invalid-registration-token' ||
                  resp.error?.code === 'messaging/registration-token-not-registered' ||
                  resp.error?.code === 'messaging/invalid-argument'
                ) {
                  invalidTokens.push(tokens[idx]);
                }
              } else {
                console.log(`✅ Token ${idx} sent successfully`);
              }
            });
            
            if (invalidTokens.length > 0) {
              try {
                await fcmTokensModel.removeInvalidTokens(invalidTokens);
                console.log(`🗑️ Removed ${invalidTokens.length} invalid FCM tokens`);
              } catch (cleanupError) {
                console.error('❌ Error cleaning up invalid tokens:', cleanupError);
              }
            }
          } else {
            console.log('✅ All notifications sent successfully!');
          }
        } else {
          console.log('⚠️ No tokens found for receiver:', receiverId);
          console.log('💡 Make sure the receiver has registered their FCM token via /api/save-fcm-token');
        }
      } catch (notificationError) {
        // Don't fail the message send if notification fails
        console.error('❌ Error sending push notification:', notificationError);
        console.error('❌ Notification error details:', {
          message: notificationError.message,
          code: notificationError.code,
          stack: notificationError.stack,
          name: notificationError.name
        });
      }

      const receiverSockets = await io.in(`user:${receiverId}`).fetchSockets();
      const isReceiverOnline = receiverSockets.length > 0;

      // Get updated conversation data for both users
      const _messagesModel = require('./messages/messages.model');
      const conversationsService = require('./messages/messages.service');

      // Get user names for logging
      let senderNameForLog = senderId;
      let receiverNameForLog = receiverId;
      try {
        const pool = require('./config/db');
        // Fetch both user names in a single query
        const nameQuery = `
          SELECT id, full_name, username
          FROM users
          WHERE id = $1 OR id = $2
        `;
        const nameResult = await pool.query(nameQuery, [senderId, receiverId]);
        
        nameResult.rows.forEach(row => {
          const name = row.full_name || row.username || row.id;
          if (row.id === senderId) {
            senderNameForLog = name;
          }
          if (row.id === receiverId) {
            receiverNameForLog = name;
          }
        });
        
        console.log('👤 User names for logging:', {
          sender: senderNameForLog,
          receiver: receiverNameForLog
        });
      } catch (nameError) {
        // If name lookup fails, just use IDs
        console.warn('Could not fetch user names for logging:', nameError.message);
      }

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
      console.log(`📤 Emitting receive_message to user:${receiverNameForLog} (${receiverId})`);
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
      console.log(`📤 Emitting receive_message to sender:${senderNameForLog} (${senderId})`);
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

const admin = require("firebase-admin");
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
// Supports both service account JSON file path and environment variables
let credential = null;
let isInitialized = false;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    // Option 1: Use service account JSON file path
    const filePath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Firebase service account file not found:', filePath);
        console.warn('💡 Comment out FIREBASE_SERVICE_ACCOUNT_PATH in .env if not using Firebase');
      }
    } else {
      try {
        const serviceAccount = require(filePath);
        credential = admin.credential.cert(serviceAccount);
        console.log('✅ Firebase service account loaded from file:', filePath);
      } catch (error) {
        console.error('❌ Error loading Firebase service account file:', error.message);
        console.warn('⚠️ Push notifications will not work until Firebase is configured');
      }
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Option 2: Use service account JSON as environment variable (base64 encoded or JSON string)
    try {
      const serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string' 
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : process.env.FIREBASE_SERVICE_ACCOUNT;
      credential = admin.credential.cert(serviceAccount);
      console.log('✅ Firebase service account loaded from environment variable');
    } catch (error) {
      console.error('❌ Error parsing FIREBASE_SERVICE_ACCOUNT:', error.message);
      console.warn('⚠️ Push notifications will not work until Firebase is configured');
    }
  } else {
    // Firebase not configured - this is OK, just silently skip initialization
    // Only log in development mode to avoid noise in production
    if (process.env.NODE_ENV === 'development') {
      console.log('ℹ️  Firebase not configured - push notifications disabled');
      console.log('💡 To enable: uncomment FIREBASE_SERVICE_ACCOUNT_PATH in .env');
    }
  }

  // Initialize Firebase Admin only if credential is available and not already initialized
  if (credential && !admin.apps.length) {
    admin.initializeApp({
      credential: credential
    });
    isInitialized = true;
    console.log('✅ Firebase Admin SDK initialized successfully');
  }
} catch (error) {
  console.error('❌ Firebase Admin SDK initialization error:', error.message);
  console.warn('⚠️ Push notifications will not work until Firebase is configured');
}

// Export admin with initialization status check
const firebaseAdmin = {
  ...admin,
  isInitialized: () => isInitialized && admin.apps.length > 0,
  messaging: () => {
    if (!isInitialized || admin.apps.length === 0) {
      throw new Error('Firebase Admin SDK is not initialized. Please configure Firebase credentials.');
    }
    return admin.messaging();
  }
};

module.exports = firebaseAdmin;
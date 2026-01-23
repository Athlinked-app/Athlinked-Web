const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
require('dotenv').config();

const signupRoutes = require('./signup/signup.routes');
const loginRoutes = require('./login/login.routes');
const authRoutes = require('./auth/auth.routes');
const clipsRoutes = require('./clips/clips.routes');
const commentsRoutes = require('./comments/comments.routes');
const forgotPasswordRoutes = require('./forgot-password/forgot-password.routes');
const postsRoutes = require('./posts/posts.routes');
const articlesRoutes = require('./articles/articles.routes');
const videosRoutes = require('./videos/videos.routes');
const templatesRoutes = require('./templates/templates.routes');
const resourcesRoutes = require('./resources/resources.routes');
const networkRoutes = require('./network/network.routes');
const messagesRoutes = require('./messages/messages.routes');
const statsRoutes = require('./stats/stats.routes');
const profileRoutes = require('./profile/profile.routes');
const profileUploadRoutes = require('./profile/profile-upload.routes');
const notificationsRoutes = require('./notifications/notifications.routes');
const favoritesRoutes = require('./favorites/favorites.routes');
const searchRoutes = require('./search/search.routes');
const savesRoutes = require('./saves/saves.routes');

const app = express();

// CORS configuration - allow production frontend and localhost for development
const allowedOrigins = [
  'http://localhost:3000',
  'https://athlinked-api.randomw.dev',
  'https://athlinked.randomw.dev',
  'https://athlinked.randomw.dev/', // With trailing slash
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
].filter(Boolean); // Remove undefined values

// Normalize origin by removing trailing slash
const normalizeOrigin = (origin) => {
  if (!origin) return origin;
  return origin.replace(/\/$/, '');
};

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      // Only log in production for security monitoring
      if (process.env.NODE_ENV === 'production') {
        console.log('CORS: Allowing request with no origin');
      }
      return callback(null, true);
    }
    
    const normalizedOrigin = normalizeOrigin(origin);
    const normalizedAllowedOrigins = allowedOrigins.map(normalizeOrigin);
    
    // In development, allow all origins (silently)
    if (process.env.NODE_ENV !== 'production') {
      // Removed verbose logging - only log warnings/errors
      return callback(null, true);
    }
    
    // In production, check if origin is in allowed list
    if (normalizedAllowedOrigins.includes(normalizedOrigin)) {
      // Only log first time or on errors
      callback(null, true);
    } else {
      // Log but allow for now to prevent breaking (can be stricter later)
      console.warn(`CORS: Unknown origin but allowing: ${origin} (normalized: ${normalizedOrigin})`);
      console.warn(`CORS: Allowed origins: ${normalizedAllowedOrigins.join(', ')}`);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static('public/uploads'));

// Swagger documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'AthLinked API Documentation',
  })
);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.use('/api/signup', signupRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/clips', clipsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/forgot-password', forgotPasswordRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/videos', videosRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api', statsRoutes);
app.use('/api/profile', profileUploadRoutes); // Upload route must be first
app.use('/api/profile', profileRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/save', savesRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

module.exports = app;

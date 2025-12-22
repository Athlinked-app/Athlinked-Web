const express = require('express');
const cors = require('cors');
require('dotenv').config();

const signupRoutes = require('./signup/signup.routes');
const clipsRoutes = require('./clips/clips.routes');
const commentsRoutes = require('./comments/comments.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static('public/uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Routes
app.use('/api/signup', signupRoutes);
app.use('/api/clips', clipsRoutes);
app.use('/api/comments', commentsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

module.exports = app;

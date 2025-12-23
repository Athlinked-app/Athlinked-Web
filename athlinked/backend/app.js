const express = require('express');
const cors = require('cors');
require('dotenv').config();

const signupRoutes = require('./signup/signup.routes');
const loginRoutes = require('./login/login.routes');
const clipsRoutes = require('./clips/clips.routes');
const commentsRoutes = require('./comments/comments.routes');
const forgotPasswordRoutes = require('./forgot-password/forgot-password.routes');
const postsRoutes = require('./posts/posts.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static('public/uploads'));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.use('/api/signup', signupRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/clips', clipsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/forgot-password', forgotPasswordRoutes);
app.use('/api/posts', postsRoutes);

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

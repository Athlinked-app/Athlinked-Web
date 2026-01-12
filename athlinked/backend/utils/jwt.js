const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET =
  process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || JWT_SECRET + '-refresh';
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

/**
 * Generate access token (short-lived) for user
 * @param {object} user - User object with id, email, username, etc.
 * @returns {string} JWT access token
 */
function generateAccessToken(user) {
  const payload = {
    id: user.id,
    email: user.email || null,
    username: user.username || null,
    user_type: user.user_type || null,
    type: 'access',
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}

/**
 * Generate refresh token (long-lived) for user
 * @param {object} user - User object with id
 * @returns {string} Refresh token (random string, not JWT)
 */
function generateRefreshToken(user) {
  // Generate a secure random token
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Generate JWT token for user (backward compatibility - generates access token)
 * @param {object} user - User object with id, email, username, etc.
 * @returns {string} JWT access token
 * @deprecated Use generateAccessToken instead
 */
function generateToken(user) {
  return generateAccessToken(user);
}

/**
 * Verify access token
 * @param {string} token - JWT access token to verify
 * @returns {object} Decoded token payload
 */
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Access token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid access token');
    } else {
      throw new Error('Access token verification failed');
    }
  }
}

/**
 * Verify JWT token (backward compatibility - verifies access token)
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload or null if invalid
 * @deprecated Use verifyAccessToken instead
 */
function verifyToken(token) {
  return verifyAccessToken(token);
}

/**
 * Verify refresh token secret (for JWT-based refresh tokens if needed)
 * @param {string} token - Refresh token to verify
 * @returns {object} Decoded token payload
 */
function verifyRefreshTokenJWT(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    } else {
      throw new Error('Refresh token verification failed');
    }
  }
}

/**
 * Generate password reset token
 * @param {object} user - User object with id, email, username
 * @returns {string} JWT password reset token (expires in 1 hour)
 */
function generatePasswordResetToken(user) {
  const payload = {
    id: user.id,
    email: user.email || null,
    username: user.username || null,
    type: 'password_reset',
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '1h', // Password reset link expires in 1 hour
  });
}

/**
 * Verify password reset token
 * @param {string} token - Password reset token to verify
 * @returns {object} Decoded token payload
 */
function verifyPasswordResetToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'password_reset') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error(
        'Password reset link has expired. Please request a new one.'
      );
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid password reset link');
    } else {
      throw error;
    }
  }
}

/**
 * Decode token without verification (for debugging)
 * @param {string} token - JWT token to decode
 * @returns {object} Decoded token payload
 */
function decodeToken(token) {
  return jwt.decode(token);
}

module.exports = {
  generateToken, // Deprecated - use generateAccessToken
  generateAccessToken,
  generateRefreshToken,
  generatePasswordResetToken,
  verifyToken, // Deprecated - use verifyAccessToken
  verifyAccessToken,
  verifyRefreshTokenJWT,
  verifyPasswordResetToken,
  decodeToken,
};

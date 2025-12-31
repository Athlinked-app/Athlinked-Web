const { verifyAccessToken } = require('../utils/jwt');

/**
 * Authentication middleware to verify JWT token
 * Sets req.user with user information if token is valid
 */
function authenticateToken(req, res, next) {
  // Get token from Authorization header or cookie
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
    });
  }

  try {
    const decoded = verifyAccessToken(token);

    // Attach user info to request object
    req.user = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
      user_type: decoded.user_type,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Invalid or expired token',
    });
  }
}

/**
 * Optional authentication middleware - doesn't fail if no token
 * Sets req.user only if token is valid
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      req.user = {
        id: decoded.id,
        email: decoded.email,
        username: decoded.username,
        user_type: decoded.user_type,
      };
    } catch (error) {
      // Token invalid but continue without user
      req.user = null;
    }
  }

  next();
}

module.exports = {
  authenticateToken,
  optionalAuth,
};

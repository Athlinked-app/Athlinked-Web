const refreshTokensModel = require('./refresh-tokens.model');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class RefreshTokensService {
  /**
   * Create access and refresh token pair
   */
  async createTokenPair(userData, userAgent = null, ipAddress = null) {
    try {
      // Generate access token (JWT)
      const accessToken = jwt.sign(
        {
          id: userData.id,
          email: userData.email || null,
          username: userData.username || null,
          user_type: userData.user_type || null,
          type: 'access',
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m' }
      );

      // Generate refresh token (random string)
      const refreshToken = crypto.randomBytes(64).toString('hex');

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      // Store refresh token in database using model
      await refreshTokensModel.storeRefreshToken(
        userData.id,
        refreshToken,
        expiresAt,
        userAgent,
        ipAddress
      );

      return { accessToken, refreshToken };
    } catch (error) {
      console.error('Error creating token pair:', error);
      throw error;
    }
  }

  /**
   * Create/store refresh token for user (for backward compatibility with Google OAuth)
   */
  async createRefreshToken(userId, token) {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const result = await refreshTokensModel.storeRefreshToken(
        userId,
        token,
        expiresAt
      );
      return result;
    } catch (error) {
      console.error('Error creating refresh token:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken, userData) {
    try {
      // Verify token exists and is valid using model
      const storedToken = await refreshTokensModel.findRefreshToken(refreshToken);

      if (!storedToken) {
        throw new Error('Invalid or expired refresh token');
      }

      // Generate new access token
      const accessToken = jwt.sign(
        {
          id: userData.id,
          email: userData.email || null,
          username: userData.username || null,
          user_type: userData.user_type || null,
          type: 'access',
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m' }
      );

      return { accessToken };
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  }

  /**
   * Revoke refresh token
   */
  async revokeToken(token) {
    try {
      await refreshTokensModel.revokeRefreshToken(token);
    } catch (error) {
      console.error('Error revoking token:', error);
      throw error;
    }
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeAllUserTokens(userId) {
    try {
      await refreshTokensModel.revokeAllUserTokens(userId);
    } catch (error) {
      console.error('Error revoking all user tokens:', error);
      throw error;
    }
  }

  /**
   * Find refresh token
   */
  async findRefreshToken(token) {
    try {
      return await refreshTokensModel.findRefreshToken(token);
    } catch (error) {
      console.error('Error finding refresh token:', error);
      throw error;
    }
  }
}

const refreshTokensServiceInstance = new RefreshTokensService();

// Export the instance and also attach bound methods to ensure compatibility
module.exports = refreshTokensServiceInstance;
module.exports.createRefreshToken = refreshTokensServiceInstance.createRefreshToken.bind(refreshTokensServiceInstance);
module.exports.createTokenPair = refreshTokensServiceInstance.createTokenPair.bind(refreshTokensServiceInstance);
module.exports.refreshAccessToken = refreshTokensServiceInstance.refreshAccessToken.bind(refreshTokensServiceInstance);
module.exports.revokeToken = refreshTokensServiceInstance.revokeToken.bind(refreshTokensServiceInstance);
module.exports.revokeAllUserTokens = refreshTokensServiceInstance.revokeAllUserTokens.bind(refreshTokensServiceInstance);
module.exports.findRefreshToken = refreshTokensServiceInstance.findRefreshToken.bind(refreshTokensServiceInstance);
const refreshTokensModel = require('./refresh-tokens.model');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');

/**
 * Create and store a refresh token for a user
 * @param {object} user - User object
 * @param {string} deviceInfo - Optional device information
 * @param {string} ipAddress - Optional IP address
 * @returns {Promise<object>} Object with accessToken and refreshToken
 */
async function createTokenPair(user, deviceInfo = null, ipAddress = null) {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Calculate expiration (7 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Store refresh token in database
  await refreshTokensModel.storeRefreshToken(
    user.id,
    refreshToken,
    expiresAt,
    deviceInfo,
    ipAddress
  );

  return {
    accessToken,
    refreshToken,
  };
}

/**
 * Refresh access token using refresh token
 * @param {string} refreshTokenString - Refresh token string
 * @param {object} user - User object from database
 * @returns {Promise<object>} New access token and optionally new refresh token
 */
async function refreshAccessToken(refreshTokenString, user) {
  // Verify refresh token exists and is valid
  const storedToken =
    await refreshTokensModel.findRefreshToken(refreshTokenString);

  if (!storedToken) {
    throw new Error('Invalid or expired refresh token');
  }

  // Verify token belongs to the user
  if (storedToken.user_id !== user.id) {
    throw new Error('Refresh token does not belong to user');
  }

  // Generate new access token
  const accessToken = generateAccessToken(user);

  // Optionally rotate refresh token (for better security)
  // For now, we'll keep the same refresh token
  // You can implement token rotation if needed

  return {
    accessToken,
    refreshToken: refreshTokenString, // Keep same refresh token
  };
}

/**
 * Revoke a refresh token (logout)
 * @param {string} refreshTokenString - Refresh token string
 * @returns {Promise<boolean>} True if token was revoked
 */
async function revokeToken(refreshTokenString) {
  return await refreshTokensModel.revokeRefreshToken(refreshTokenString);
}

/**
 * Revoke all tokens for a user (logout from all devices)
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of tokens revoked
 */
async function revokeAllUserTokens(userId) {
  return await refreshTokensModel.revokeAllUserTokens(userId);
}

module.exports = {
  createTokenPair,
  refreshAccessToken,
  revokeToken,
  revokeAllUserTokens,
};

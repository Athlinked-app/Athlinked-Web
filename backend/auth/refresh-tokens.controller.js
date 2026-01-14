const refreshTokensService = require('./refresh-tokens.service');
const refreshTokensModel = require('./refresh-tokens.model');
const signupModel = require('../signup/signup.model');

/**
 * Refresh access token using refresh token
 * POST /api/auth/refresh
 */
async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Find the refresh token in database
    const storedToken = await refreshTokensModel.findRefreshToken(refreshToken);

    if (!storedToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }

    // Get user data
    const user = await signupModel.findById(storedToken.user_id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Generate new access token
    const { accessToken } = await refreshTokensService.refreshAccessToken(
      refreshToken,
      {
        id: user.id,
        email: user.email,
        username: user.username,
        user_type: user.user_type,
      }
    );

    return res.status(200).json({
      success: true,
      accessToken,
      refreshToken, // Return same refresh token
    });
  } catch (error) {
    console.error('Refresh token controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/**
 * Revoke refresh token (logout)
 * POST /api/auth/logout
 */
async function logout(req, res) {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await refreshTokensService.revokeToken(refreshToken);
    }

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/**
 * Revoke all tokens for current user (logout from all devices)
 * POST /api/auth/logout-all
 */
async function logoutAll(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    await refreshTokensService.revokeAllUserTokens(userId);

    return res.status(200).json({
      success: true,
      message: 'Logged out from all devices successfully',
    });
  } catch (error) {
    console.error('Logout all controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

module.exports = {
  refreshToken,
  logout,
  logoutAll,
};

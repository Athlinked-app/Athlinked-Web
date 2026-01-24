const forgotPasswordService = require('./forgot-password.service');

/**
 * Controller to handle password reset link request
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function requestResetLink(req, res) {
  try {
    const { emailOrUsername } = req.body;

    if (!emailOrUsername) {
      return res.status(400).json({
        success: false,
        message: 'Email or username is required',
      });
    }

    // Detect if request is from mobile app
    const { isMobileRequest } = require('../utils/deepLinkUtils');
    const isMobile = isMobileRequest(req);

    // Log request details for debugging
    console.log('Password reset request:', {
      emailOrUsername: emailOrUsername.substring(0, 20) + '...',
      isMobile,
      clientType: req.headers['x-client-type'],
      userAgent: req.headers['user-agent']?.substring(0, 50),
    });

    // Pass isMobile flag to service
    const result = await forgotPasswordService.requestResetLinkService(
      emailOrUsername,
      isMobile
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error('Request reset link error:', error);

    if (
      error.message === 'User not found' ||
      error.message === 'No email found for this user'
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/**
 * Controller to handle password reset using token
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
    }

    const result = await forgotPasswordService.resetPasswordService(
      token,
      newPassword
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error('Reset password error:', error);

    if (
      error.message.includes('expired') ||
      error.message.includes('Invalid') ||
      error.message.includes('Invalid token')
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === 'Password must be at least 8 characters long') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

module.exports = {
  requestResetLink,
  resetPassword,
};

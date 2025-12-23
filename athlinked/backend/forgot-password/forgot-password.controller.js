const forgotPasswordService = require('./forgot-password.service');

/**
 * Controller to handle password reset OTP request
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function requestOTP(req, res) {
  try {
    const { emailOrUsername } = req.body;

    if (!emailOrUsername) {
      return res.status(400).json({
        success: false,
        message: 'Email or username is required',
      });
    }

    const result =
      await forgotPasswordService.requestOTPService(emailOrUsername);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Request OTP error:', error);

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
 * Controller to handle OTP verification for password reset
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function verifyOTP(req, res) {
  try {
    const { emailOrUsername, otp } = req.body;

    if (!emailOrUsername || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email/username and OTP are required',
      });
    }

    const result = await forgotPasswordService.verifyOTPService(
      emailOrUsername,
      otp
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error('Verify OTP error:', error);

    if (
      error.errorType === 'NOT_FOUND' ||
      error.errorType === 'EXPIRED' ||
      error.errorType === 'INVALID'
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message === 'User not found' ||
      error.message === 'No email found for OTP verification'
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
 * Controller to handle password reset
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function resetPassword(req, res) {
  try {
    const { emailOrUsername, otp, newPassword } = req.body;

    if (!emailOrUsername || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email/username, OTP, and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
    }

    const result = await forgotPasswordService.resetPasswordService(
      emailOrUsername,
      otp,
      newPassword
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error('Reset password error:', error);

    if (
      error.errorType === 'NOT_FOUND' ||
      error.errorType === 'EXPIRED' ||
      error.errorType === 'INVALID'
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

    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

module.exports = {
  requestOTP,
  verifyOTP,
  resetPassword,
};

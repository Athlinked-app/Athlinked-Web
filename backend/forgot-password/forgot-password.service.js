const forgotPasswordModel = require('./forgot-password.model');
const { sendPasswordResetLink } = require('../utils/email');
const { hashPassword } = require('../utils/hash');
const {
  generatePasswordResetToken,
  verifyPasswordResetToken,
} = require('../utils/jwt');
const { storeOldPassword } = require('./old-password.store');

/**
 * Check if string is an email
 * @param {string} str - String to check
 * @returns {boolean} True if email, false otherwise
 */
function isEmail(str) {
  return str && str.includes('@');
}

/**
 * Request password reset link
 * @param {string} emailOrUsername - User email or username
 * @param {boolean} isMobile - Whether request is from mobile app
 * @returns {Promise<object>} Service result with email where reset link was sent
 */
async function requestResetLinkService(emailOrUsername, isMobile = false) {
  try {
    if (!emailOrUsername) {
      throw new Error('Email or username is required');
    }

    const normalizedInput = emailOrUsername.toLowerCase().trim();
    let user;
    let emailToSendLink;

    if (isEmail(normalizedInput)) {
      user = await forgotPasswordModel.findByEmail(normalizedInput);
      if (!user) {
        throw new Error('User not found');
      }
      emailToSendLink = user.email;
    } else {
      user = await forgotPasswordModel.findByUsername(normalizedInput);
      if (!user) {
        throw new Error('User not found');
      }
      if (user.email) {
        emailToSendLink = user.email;
      } else if (user.parent_email) {
        emailToSendLink = user.parent_email;
      } else {
        throw new Error('No email found for this user');
      }
    }

    // Generate password reset token
    const resetToken = generatePasswordResetToken({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    // Generate appropriate reset link based on client type
    const { generatePasswordResetLink } = require('../utils/deepLinkUtils');
    const resetLink = generatePasswordResetLink(resetToken, isMobile);

    // Log generated link details for debugging
    console.log('Generated reset link:', {
      isMobile,
      linkType: isMobile ? 'universal (HTTPS)' : 'web',
      link: resetLink.substring(0, 50) + '...',
      domain: isMobile ? (process.env.DEEP_LINK_DOMAIN || 'athlinked.randomw.dev') : 'web',
    });

    // Send reset link via email
    await sendPasswordResetLink(emailToSendLink, resetLink, isMobile);

    console.log(`🔗 Password reset link sent to: ${emailToSendLink} (${isMobile ? 'Mobile' : 'Web'})`);

    return {
      success: true,
      message: 'Password reset link sent successfully',
      email: emailToSendLink, // Return email where link was sent (masked in production)
    };
  } catch (error) {
    console.error('Request reset link service error:', error.message);
    throw error;
  }
}

/**
 * Reset password using reset token
 * @param {string} token - Password reset token
 * @param {string} newPassword - New password
 * @returns {Promise<object>} Service result
 */
async function resetPasswordService(token, newPassword) {
  try {
    if (!token || !newPassword) {
      throw new Error('Reset token and new password are required');
    }

    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Verify the reset token
    const decoded = verifyPasswordResetToken(token);

    // Find user by ID from token
    let user;

    if (decoded.email) {
      user = await forgotPasswordModel.findByEmail(decoded.email);
    } else if (decoded.username) {
      user = await forgotPasswordModel.findByUsername(decoded.username);
    } else {
      throw new Error('Invalid token: user identifier not found');
    }

    if (!user) {
      throw new Error('User not found');
    }

    // Verify the token user ID matches the found user
    if (user.id !== decoded.id) {
      throw new Error('Invalid token: user mismatch');
    }

    // Store old password hash before updating (for 24 hours)
    const oldPasswordHash = user.password;
    storeOldPassword(user.id, oldPasswordHash, 24);

    // Hash and update password
    const hashedPassword = await hashPassword(newPassword);
    const isEmailInput = isEmail(user.email);
    const identifier = isEmailInput ? user.email : user.username;
    const updatedUser = await forgotPasswordModel.updatePassword(
      identifier,
      isEmailInput,
      hashedPassword
    );

    return {
      success: true,
      message: 'Password reset successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
      },
    };
  } catch (error) {
    console.error('Reset password service error:', error.message);
    throw error;
  }
}

module.exports = {
  requestResetLinkService,
  resetPasswordService,
};

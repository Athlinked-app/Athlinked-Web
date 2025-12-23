const forgotPasswordModel = require('./forgot-password.model');
const { startOTPFlow, verifyOTP } = require('../signup/otp.service');
const { sendOTPEmail } = require('../utils/email');
const { hashPassword } = require('../utils/hash');

/**
 * Check if string is an email
 * @param {string} str - String to check
 * @returns {boolean} True if email, false otherwise
 */
function isEmail(str) {
  return str && str.includes('@');
}

/**
 * Request OTP for password reset
 * @param {string} emailOrUsername - User email or username
 * @returns {Promise<object>} Service result with email where OTP was sent
 */
async function requestOTPService(emailOrUsername) {
  try {
    if (!emailOrUsername) {
      throw new Error('Email or username is required');
    }

    const normalizedInput = emailOrUsername.toLowerCase().trim();
    let user;
    let emailToSendOTP;

    if (isEmail(normalizedInput)) {
      user = await forgotPasswordModel.findByEmail(normalizedInput);
      if (!user) {
        throw new Error('User not found');
      }
      emailToSendOTP = user.email;
    } else {
      user = await forgotPasswordModel.findByUsername(normalizedInput);
      if (!user) {
        throw new Error('User not found');
      }
      if (user.email) {
        emailToSendOTP = user.email;
      } else if (user.parent_email) {
        emailToSendOTP = user.parent_email;
      } else {
        throw new Error('No email found for this user');
      }
    }

    const otpData = {
      emailOrUsername: normalizedInput,
      isEmail: isEmail(normalizedInput),
      email: emailToSendOTP,
    };

    const otp = startOTPFlow(otpData);
    console.log(
      `🔐 OTP generated for password reset: ${emailToSendOTP} (NOT returned in response)`
    );
    await sendOTPEmail(emailToSendOTP, otp);

    return {
      success: true,
      message: 'OTP sent successfully',
      email: emailToSendOTP, // Return email where OTP was sent (masked in production)
    };
  } catch (error) {
    console.error('Request OTP service error:', error.message);
    throw error;
  }
}

/**
 * Verify OTP for password reset
 * @param {string} emailOrUsername - User email or username
 * @param {string} otp - OTP entered by user
 * @returns {Promise<object>} Service result
 */
async function verifyOTPService(emailOrUsername, otp) {
  try {
    if (!emailOrUsername || !otp) {
      throw new Error('Email/username and OTP are required');
    }

    const normalizedInput = emailOrUsername.toLowerCase().trim();
    let user;
    let emailForOTP;

    if (isEmail(normalizedInput)) {
      user = await forgotPasswordModel.findByEmail(normalizedInput);
      if (!user) {
        throw new Error('User not found');
      }
      emailForOTP = user.email;
    } else {
      user = await forgotPasswordModel.findByUsername(normalizedInput);
      if (!user) {
        throw new Error('User not found');
      }
      emailForOTP = user.email || user.parent_email;
    }

    if (!emailForOTP) {
      throw new Error('No email found for OTP verification');
    }

    const { getOTP } = require('../signup/otp.store');
    const normalizedEmail = emailForOTP.toLowerCase().trim();
    const stored = getOTP(normalizedEmail);

    if (!stored) {
      const error = new Error('OTP not found. Please request a new OTP.');
      error.errorType = 'NOT_FOUND';
      throw error;
    }

    if (stored.expired) {
      const error = new Error('OTP expired. Please request a new OTP.');
      error.errorType = 'EXPIRED';
      throw error;
    }

    if (stored.otp !== otp) {
      const error = new Error('Invalid OTP. Please try again.');
      error.errorType = 'INVALID';
      throw error;
    }

    return {
      success: true,
      message: 'OTP verified successfully',
    };
  } catch (error) {
    console.error('Verify OTP service error:', error.message);
    throw error;
  }
}

/**
 * Reset password after OTP verification
 * @param {string} emailOrUsername - User email or username
 * @param {string} otp - OTP entered by user
 * @param {string} newPassword - New password
 * @returns {Promise<object>} Service result
 */
async function resetPasswordService(emailOrUsername, otp, newPassword) {
  try {
    if (!emailOrUsername || !otp || !newPassword) {
      throw new Error('Email/username, OTP, and new password are required');
    }

    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const normalizedInput = emailOrUsername.toLowerCase().trim();
    let user;
    let emailForOTP;

    if (isEmail(normalizedInput)) {
      user = await forgotPasswordModel.findByEmail(normalizedInput);
      if (!user) {
        throw new Error('User not found');
      }
      emailForOTP = user.email;
    } else {
      user = await forgotPasswordModel.findByUsername(normalizedInput);
      if (!user) {
        throw new Error('User not found');
      }
      emailForOTP = user.email || user.parent_email;
    }

    if (!emailForOTP) {
      throw new Error('No email found for OTP verification');
    }

    const verification = verifyOTP(emailForOTP.toLowerCase(), otp);

    if (!verification.isValid) {
      const error = new Error(verification.error);
      error.errorType = verification.errorType;
      throw error;
    }

    const hashedPassword = await hashPassword(newPassword);
    const isEmailInput = isEmail(normalizedInput);
    const updatedUser = await forgotPasswordModel.updatePassword(
      normalizedInput,
      isEmailInput,
      hashedPassword
    );

    console.log(`✅ Password reset successfully for ${normalizedInput}`);

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
  requestOTPService,
  verifyOTPService,
  resetPasswordService,
};

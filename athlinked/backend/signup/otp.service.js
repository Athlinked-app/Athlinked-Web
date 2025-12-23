const { storeOTP, getOTP, deleteOTP } = require('./otp.store');

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Start signup process: generate and store OTP
 * @param {object} signupData - User signup data
 * @returns {string} Generated OTP
 */
function startOTPFlow(signupData) {
  const email = signupData.email ? signupData.email.toLowerCase() : null;

  if (!email) {
    throw new Error('Email is required for OTP flow');
  }

  const otp = generateOTP();
  const expiresInMinutes = 5;

  storeOTP(email, otp, expiresInMinutes, signupData);

  return otp;
}

/**
 * Verify OTP
 * @param {string} email - User email
 * @param {string} userEnteredOTP - OTP entered by user
 * @returns {object} Verification result with signupData if valid
 */
function verifyOTP(email, userEnteredOTP) {
  const stored = getOTP(email.toLowerCase());

  if (!stored) {
    return {
      isValid: false,
      error: 'OTP not found. Please request a new OTP.',
      errorType: 'NOT_FOUND',
    };
  }

  if (stored.expired) {
    return {
      isValid: false,
      error: 'OTP expired. Please request a new OTP.',
      errorType: 'EXPIRED',
    };
  }

  if (stored.otp !== userEnteredOTP) {
    return {
      isValid: false,
      error: 'Invalid OTP. Please try again.',
      errorType: 'INVALID',
    };
  }

  deleteOTP(email.toLowerCase());

  return {
    isValid: true,
    signupData: stored.signupData,
  };
}

module.exports = {
  generateOTP,
  startOTPFlow,
  verifyOTP,
};

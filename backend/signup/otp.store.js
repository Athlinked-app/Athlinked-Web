/**
 * In-memory storage for OTP data
 * Structure: email → { otp, expiresAt, signupData }
 */
const otpStore = new Map();

/**
 * Store OTP with expiration and signup data
 * @param {string} email - User email
 * @param {string} otp - OTP code
 * @param {number} expiresInMinutes - Expiration time in minutes
 * @param {object} signupData - User signup data
 */
function storeOTP(email, otp, expiresInMinutes, signupData) {
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;

  otpStore.set(email.toLowerCase(), {
    otp,
    expiresAt,
    signupData,
  });
}

/**
 * Get OTP data by email
 * @param {string} email - User email
 * @returns {object|null} OTP data or null if not found/expired
 */
function getOTP(email) {
  const stored = otpStore.get(email.toLowerCase());

  if (!stored) {
    return null;
  }

  const now = Date.now();
  if (now > stored.expiresAt) {
    otpStore.delete(email.toLowerCase());
    return { expired: true };
  }

  return stored;
}

/**
 * Delete OTP entry
 * @param {string} email - User email
 */
function deleteOTP(email) {
  otpStore.delete(email.toLowerCase());
}

/**
 * Clean expired OTPs (optional cleanup function)
 */
function cleanExpiredOTPs() {
  const now = Date.now();
  let cleaned = 0;

  for (const [email, data] of otpStore.entries()) {
    if (now > data.expiresAt) {
      otpStore.delete(email);
      cleaned++;
    }
  }

  // Cleaned expired OTPs
}

module.exports = {
  storeOTP,
  getOTP,
  deleteOTP,
  cleanExpiredOTPs,
};

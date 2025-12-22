const signupModel = require('./signup.model');
const { hashPassword } = require('../utils/hash');
const { startOTPFlow, verifyOTP } = require('./otp.service');
const { sendOTPEmail } = require('../utils/email');

/**
 * Start signup process: validate email, generate and send OTP
 * @param {object} userData - User registration data
 * @returns {Promise<object>} Service result
 */
async function startSignupService(userData) {
  try {
    if (!userData.email) {
      throw new Error('Email is required');
    }

    const email = userData.email.toLowerCase().trim();
    const existingUser = await signupModel.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const otp = startOTPFlow({ ...userData, email });

    console.log(`🔐 OTP generated for ${email} (NOT returned in response)`);
    await sendOTPEmail(email, otp);

    return {
      success: true,
      message: 'OTP sent to email',
    };
  } catch (error) {
    console.error('Start signup service error:', error.message);
    throw error;
  }
}

/**
 * Verify OTP and create user account
 * @param {string} email - User email
 * @param {string} otp - User-entered OTP
 * @returns {Promise<object>} Service result with user data
 */
async function verifyOtpService(email, otp) {
  try {
    const verification = verifyOTP(email, otp);

    if (!verification.isValid) {
      const error = new Error(verification.error);
      error.errorType = verification.errorType;
      throw error;
    }

    const { signupData } = verification;

    const hashedPassword = await hashPassword(signupData.password);

    const createdUser = await signupModel.createUser({
      ...signupData,
      password: hashedPassword,
    });

    console.log(`✅ User created successfully: ${createdUser.email}`);

    // Fetch complete user data including primary_sport
    const completeUser = await signupModel.findByEmail(createdUser.email);

    return {
      success: true,
      message: 'Welcome',
      user: {
        id: createdUser.id,
        email: createdUser.email,
        full_name: createdUser.full_name,
        user_type: createdUser.user_type,
        primary_sport: completeUser?.primary_sport || null,
      },
    };
  } catch (error) {
    console.error('Verify OTP service error:', error.message);
    throw error;
  }
}

module.exports = {
  startSignupService,
  verifyOtpService,
};

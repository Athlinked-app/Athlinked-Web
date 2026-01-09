 
const signupModel = require('./signup.model');
const { hashPassword } = require('../utils/hash');
const { startOTPFlow, verifyOTP } = require('./otp.service');
const { sendOTPEmail, sendParentSignupLink } = require('../utils/email');
const profileModel = require('../profile/profile.model');
const refreshTokensService = require('../auth/refresh-tokens.service');

/**
 * Check if string is an email
 * @param {string} str - String to check
 * @returns {boolean} True if email, false otherwise
 */
function isEmail(str) {
  return str && str.includes('@');
}

/**
 * Start signup process: validate email/username, generate and send OTP
 * @param {object} userData - User registration data
 * @returns {Promise<object>} Service result
 */
async function startSignupService(userData) {
  try {
    if (!userData.email) {
      throw new Error('Email or username is required');
    }

    const input = userData.email.trim();
    let emailToSendOTP;
    let username = null;
    let parentEmail = null;

    if (isEmail(input)) {
      emailToSendOTP = input.toLowerCase();
      const existingUser = await signupModel.findByEmail(emailToSendOTP);
      if (existingUser) {
        throw new Error('Email already registered');
      }

      parentEmail = userData.parent_email;
    } else {
      if (input.length < 6) {
        throw new Error('Username must be at least 6 characters long');
      }

      username = input.toLowerCase();

      const existingUser = await signupModel.findByUsername(username);
      if (existingUser) {
        throw new Error('Username already taken');
      }

      parentEmail = userData.parent_email;
      if (!parentEmail) {
        throw new Error('Parent email is required when using username');
      }

      emailToSendOTP = parentEmail.toLowerCase().trim();
    }

    const otpData = isEmail(input)
      ? { ...userData, email: emailToSendOTP }
      : {
          ...userData,
          email: emailToSendOTP,
          username: username,
          _isUsernameSignup: true,
        };

    const otp = startOTPFlow(otpData);

    await sendOTPEmail(emailToSendOTP, otp);

    if (parentEmail) {
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const signupLink = username
        ? `${baseUrl}/parent-signup?username=${encodeURIComponent(username)}`
        : `${baseUrl}/parent-signup?email=${encodeURIComponent(input.toLowerCase())}`;

      console.log(
        `📧 Attempting to send parent signup link to: ${parentEmail}`
      );
      try {
        await sendParentSignupLink(parentEmail, username || input, signupLink);
      } catch (error) {
        console.error('❌ Error: Failed to send parent signup link:', error);
        console.error('Error details:', error.message, error.stack);
      }
    } else {
    }

    return {
      success: true,
      message: 'OTP sent to email',
      email: emailToSendOTP,
    };
  } catch (error) {
    console.error('Start signup service error:', error.message);
    throw error;
  }
}

/**
 * Verify OTP and create user account
 * @param {string} email - User email (this should be the parent email when username was used)
 * @param {string} otp - User-entered OTP
 * @returns {Promise<object>} Service result with user data
 */
async function verifyOtpService(email, otp) {
  try {
    const verification = verifyOTP(email.toLowerCase(), otp);

    if (!verification.isValid) {
      const error = new Error(verification.error);
      error.errorType = verification.errorType;
      throw error;
    }

    const { signupData } = verification;

    const hashedPassword = await hashPassword(signupData.password);

    const userDataToCreate = {
      ...signupData,
      password: hashedPassword,
    };

    if (signupData.username || signupData._isUsernameSignup) {
      userDataToCreate.email = null;
      delete userDataToCreate._isUsernameSignup;
    }

    const createdUser = await signupModel.createUser(userDataToCreate);

    const completeUser = createdUser.email
      ? await signupModel.findByEmail(createdUser.email)
      : createdUser.username
        ? await signupModel.findByUsername(createdUser.username)
        : null;

    // Create profile entry with sports data
    try {
      const sportsArray = Array.isArray(signupData.sports_played)
        ? signupData.sports_played
        : signupData.sports_played
          ? [signupData.sports_played]
          : [];

      // Remove duplicates from sports array
      const uniqueSportsArray = [...new Set(sportsArray)];
      const primarySport =
        signupData.primary_sport ||
        (uniqueSportsArray.length > 0 ? uniqueSportsArray[0] : null);

      await profileModel.upsertUserProfile(createdUser.id, {
        fullName: signupData.full_name,
        primarySport: primarySport,
      });

      // deduplicated sports stored in profile; no local use needed
    } catch (profileError) {
      console.error(
        '⚠️ Error creating profile during signup:',
        profileError.message
      );
      // Don't fail signup if profile creation fails
    }

    const userData = {
      id: createdUser.id,
      email: createdUser.email || null,
      username: createdUser.username || null,
      full_name: createdUser.full_name,
      user_type: createdUser.user_type,
      primary_sport: completeUser?.primary_sport || null,
    };

    // Generate access and refresh tokens
    const { accessToken, refreshToken } =
      await refreshTokensService.createTokenPair(userData);

    return {
      success: true,
      message: 'Welcome',
      accessToken,
      refreshToken,
      user: userData,
    };
  } catch (error) {
    console.error('Verify OTP service error:', error.message);
    throw error;
  }
}

/**
 * Complete parent signup by creating a new parent user account
 * @param {string} username - Child's username (optional)
 * @param {string} email - Child's email (optional)
 * @param {string} password - Plain text password for parent
 * @returns {Promise<object>} Service result
 */
async function parentCompleteService(username, email, password) {
  try {
    let childUser;

    if (username) {
      childUser = await signupModel.findByUsername(
        username.toLowerCase().trim()
      );
      // username is used to find the childUser above
    } else if (email) {
      childUser = await signupModel.findByEmail(email.toLowerCase().trim());
      // email is used to find the childUser above
    } else {
      throw new Error('Username or email is required');
    }

    if (!childUser) {
      throw new Error('Child user not found');
    }

    const parentEmail = childUser.parent_email;
    const parentName = childUser.parent_name;

    if (!parentEmail) {
      throw new Error('Parent email not found in child record');
    }

    const existingUser = await signupModel.findByEmail(
      parentEmail.toLowerCase().trim()
    );
    if (existingUser) {
      if (existingUser.user_type === 'parent') {
        throw new Error('Parent account already exists');
      }
      throw new Error('This email is already registered');
    }

    const hashedPassword = await hashPassword(password);

    const newParentUser = await signupModel.createUser({
      user_type: 'parent',
      full_name: parentName || 'Parent',
      dob: null,
      sports_played: null,
      primary_sport: null,
      email: parentEmail.toLowerCase().trim(),
      username: null,
      password: hashedPassword,
      parent_name: null,
      parent_email: null,
      parent_dob: null,
    });

    const userData = {
      id: newParentUser.id,
      email: newParentUser.email,
      full_name: newParentUser.full_name,
      user_type: newParentUser.user_type,
    };

    // Generate JWT token
    const { generateToken } = require('../utils/jwt');
    const token = generateToken(userData);

    return {
      success: true,
      message: 'Parent account created successfully',
      token,
      user: userData,
    };
  } catch (error) {
    console.error('Parent complete service error:', error.message);
    throw error;
  }
}

/**
 * Get all users service
 * @param {string} excludeUserId - User ID to exclude from results
 * @param {number} limit - Maximum number of users to return
 * @returns {Promise<object>} Service result with users array
 */
async function getAllUsersService(excludeUserId = null, limit = 10) {
  try {
    const users = await signupModel.getAllUsers(excludeUserId, limit);

    // Remove password from all users (produce shallow copies)
    const sanitizedUsers = users.map(user => {
      const copy = { ...user };
      delete copy.password;
      return copy;
    });

    return {
      success: true,
      users: sanitizedUsers,
    };
  } catch (error) {
    console.error('Get all users service error:', error.message);
    throw error;
  }
}

/**
 * Get children for a parent by parent email
 * @param {string} parentEmail - Parent's email address
 * @returns {Promise<object>} Service result with children array
 */
async function getChildrenByParentEmailService(parentEmail) {
  try {
    if (!parentEmail) {
      throw new Error('Parent email is required');
    }

    const children = await signupModel.getChildrenByParentEmail(parentEmail);

    // Remove password from all children (produce shallow copies)
    const sanitizedChildren = children.map(child => {
      const copy = { ...child };
      delete copy.password;
      return copy;
    });

    return {
      success: true,
      children: sanitizedChildren,
    };
  } catch (error) {
    console.error('Get children service error:', error.message);
    throw error;
  }
}

/**
 * Delete user account
 * @param {string} userId - User ID to delete
 * @returns {Promise<object>} Service result
 */
async function deleteAccountService(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Verify user exists
    const user = await signupModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Store deleted account information before deletion
    const deletedAccountsModel = require('./deleted-accounts.model');
    try {
      await deletedAccountsModel.storeDeletedAccount({
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        user_type: user.user_type,
        deleted_at: new Date(),
      });
    } catch (storeError) {
      console.error('Error storing deleted account data:', storeError);
      // Continue with deletion even if storing fails
    }

    // Delete user from database
    const deleted = await signupModel.deleteUser(userId);

    if (!deleted) {
      throw new Error('Failed to delete user account');
    }

    return {
      success: true,
      message: 'Account deleted successfully',
    };
  } catch (error) {
    console.error('Delete account service error:', error.message);
    throw error;
  }
}

module.exports = {
  startSignupService,
  verifyOtpService,
  parentCompleteService,
  getAllUsersService,
  getChildrenByParentEmailService,
  deleteAccountService,
};

const loginModel = require('./login.model');
const { comparePassword } = require('../utils/hash');
const refreshTokensService = require('../auth/refresh-tokens.service');
const deletedAccountsModel = require('../signup/deleted-accounts.model');
const { getOldPassword } = require('../forgot-password/old-password.store');

/**
 * Check if string is an email
 * @param {string} str - String to check
 * @returns {boolean} True if email, false otherwise
 */
function isEmail(str) {
  return str && str.includes('@');
}

/**
 * Authenticate user with email/username and password
 * @param {string} emailOrUsername - User email or username
 * @param {string} password - Plain text password
 * @returns {Promise<object>} Service result with user data if successful
 */
async function loginService(emailOrUsername, password, req = null) {
  try {
    if (!emailOrUsername || !password) {
      throw new Error('Email/username and password are required');
    }

    const normalizedInput = emailOrUsername.toLowerCase().trim();
    
    // SECURITY: Check if account was deleted FIRST (before checking users table)
    // This prevents login even if user somehow still exists in users table
    const deletedAccount = await deletedAccountsModel.findDeletedAccountByEmailOrUsername(normalizedInput);
    
    if (deletedAccount) {
      // Account was deleted - reject login regardless of when it was deleted
      throw new Error('ACCOUNT_DELETED');
    }

    let user;

    // Check if input is email or username
    if (isEmail(normalizedInput)) {
      user = await loginModel.findByEmail(normalizedInput);
    } else {
      user = await loginModel.findByUsername(normalizedInput);
    }

    // If user not found, return generic error (don't reveal if account exists)
    if (!user) {
      throw new Error('Invalid email/username or password');
    }

    // Compare provided password with hashed password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      // Check if the provided password matches the old password hash
      const oldPasswordData = getOldPassword(user.id);
      let isOldPassword = false;

      if (oldPasswordData) {
        isOldPassword = await comparePassword(
          password,
          oldPasswordData.oldPasswordHash
        );
      }

      // Create error with flag indicating if old password was used
      const error = new Error('Invalid email/username or password');
      if (isOldPassword) {
        error.passwordChangedRecently = true;
      }
      throw error;
    }

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    const userData = {
      id: userWithoutPassword.id,
      email: userWithoutPassword.email,
      username: userWithoutPassword.username || null,
      full_name: userWithoutPassword.full_name,
      user_type: userWithoutPassword.user_type,
      primary_sport: userWithoutPassword.primary_sport || null,
    };

    // Generate access and refresh tokens
    const { accessToken, refreshToken } =
      await refreshTokensService.createTokenPair(
        userData,
        req?.headers['user-agent'] || null,
        req?.ip || null
      );

    return {
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: userData,
    };
  } catch (error) {
    console.error('Login service error:', error.message);
    throw error;
  }
}

module.exports = {
  loginService,
};

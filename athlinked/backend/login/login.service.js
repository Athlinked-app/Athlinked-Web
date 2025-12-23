const loginModel = require('./login.model');
const { comparePassword } = require('../utils/hash');

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
async function loginService(emailOrUsername, password) {
  try {
    if (!emailOrUsername || !password) {
      throw new Error('Email/username and password are required');
    }

    const normalizedInput = emailOrUsername.toLowerCase().trim();
    let user;

    // Check if input is email or username
    if (isEmail(normalizedInput)) {
      user = await loginModel.findByEmail(normalizedInput);
    } else {
      user = await loginModel.findByUsername(normalizedInput);
    }

    if (!user) {
      throw new Error('Invalid email/username or password');
    }

    // Compare provided password with hashed password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid email/username or password');
    }

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    return {
      success: true,
      message: 'Login successful',
      user: {
        id: userWithoutPassword.id,
        email: userWithoutPassword.email,
        username: userWithoutPassword.username || null,
        full_name: userWithoutPassword.full_name,
        user_type: userWithoutPassword.user_type,
        primary_sport: userWithoutPassword.primary_sport || null,
      },
    };
  } catch (error) {
    console.error('Login service error:', error.message);
    throw error;
  }
}

module.exports = {
  loginService,
};

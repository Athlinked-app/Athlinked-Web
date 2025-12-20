const signupModel = require('./signup.model');
const { hashPassword } = require('../utils/hash');

/**
 * Service to handle signup request
 * @param {object} userData - User registration data
 * @returns {Promise<object>} Service result
 */
async function signupService(userData) {
  try {
    const existingUser = await signupModel.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await hashPassword(userData.password);

    const createdUser = await signupModel.createUser({
      ...userData,
      password: hashedPassword,
    });

    console.log(`✅ User created successfully: ${createdUser.email}`);

    return {
      success: true,
      message: 'Welcome',
      user: {
        id: createdUser.id,
        email: createdUser.email,
        full_name: createdUser.full_name,
        user_type: createdUser.user_type,
      },
    };
  } catch (error) {
    console.error('Signup service error:', error.message);
    throw error;
  }
}

module.exports = {
  signupService,
};


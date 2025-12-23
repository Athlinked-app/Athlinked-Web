const signupService = require('./signup.service');
const { validateSignup } = require('./signup.validation');

/**
 * Controller to handle signup start request (generates and sends OTP)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function startSignup(req, res) {
  try {
    const validation = validateSignup(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    const result = await signupService.startSignupService(req.body);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Start signup error:', error);

    if (error.message === 'Email already registered') {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('SMTP') || error.message.includes('email')) {
      return res.status(500).json({
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
 * Controller to handle OTP verification and user creation
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required',
      });
    }

    const result = await signupService.verifyOtpService(
      email.toLowerCase().trim(),
      otp.trim()
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error('Verify OTP error:', error);

    if (error.errorType === 'EXPIRED') {
      return res.status(410).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.errorType === 'NOT_FOUND' ||
      error.errorType === 'INVALID' ||
      error.message.includes('OTP not found') ||
      error.message.includes('expired') ||
      error.message.includes('Invalid OTP')
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === 'Email already registered') {
      return res.status(409).json({
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
 * Controller to get user by email
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getUserByEmail(req, res) {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const signupModel = require('./signup.model');
    const user = await signupModel.findByEmail(email.toLowerCase().trim());

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Return user data without password
    const { password, ...userData } = user;

    return res.status(200).json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error('Get user by email error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/**
 * Controller to get user by username
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getUserByUsername(req, res) {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required',
      });
    }

    const signupModel = require('./signup.model');
    const user = await signupModel.findByUsername(
      username.toLowerCase().trim()
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Return user data without password
    const { password, ...userData } = user;

    return res.status(200).json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error('Get user by username error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/**
 * Controller to handle parent completing signup (setting password)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function parentComplete(req, res) {
  try {
    const { username, email, password } = req.body;

    if ((!username && !email) || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username or email and password are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
    }

    const result = await signupService.parentCompleteService(
      username,
      email,
      password
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error('Parent complete error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

module.exports = {
  startSignup,
  verifyOtp,
  getUserByEmail,
  getUserByUsername,
  parentComplete,
};

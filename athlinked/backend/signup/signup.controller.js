const signupService = require('./signup.service');
const { validateSignup } = require('./signup.validation');

/**
 * Controller to handle signup request
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function signup(req, res) {
  try {
    const validation = validateSignup(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    const result = await signupService.signupService(req.body);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Signup error:', error);

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

module.exports = {
  signup,
};


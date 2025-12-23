const loginService = require('./login.service');

/**
 * Controller to handle login request
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/username and password are required',
      });
    }

    const result = await loginService.loginService(email, password);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Login controller error:', error);

    if (error.message === 'Invalid email or password') {
      return res.status(401).json({
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
  login,
};

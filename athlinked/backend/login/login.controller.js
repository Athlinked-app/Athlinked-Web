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

    const result = await loginService.loginService(email, password, req);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Login controller error:', error);

    // Check if account was recently deleted
    if (error.message === 'ACCOUNT_DELETED_RECENTLY') {
      return res.status(403).json({
        success: false,
        message: 'ACCOUNT_DELETED_RECENTLY',
        error: 'This account was deleted recently. Please contact support if you believe this is an error.',
      });
    }

    if (error.message === 'Invalid email or password' || error.message === 'Invalid email/username or password') {
      const passwordChangedRecently = error.passwordChangedRecently === true;
      console.log('Login error - passwordChangedRecently flag:', passwordChangedRecently);
      return res.status(401).json({
        success: false,
        message: error.message,
        passwordChangedRecently: passwordChangedRecently,
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

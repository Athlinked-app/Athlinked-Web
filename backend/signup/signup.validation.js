/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if string is an email (contains @)
 * @param {string} str - String to check
 * @returns {boolean} True if email
 */
function isEmail(str) {
  return str && str.includes('@');
}

/**
 * Validate signup request (email or username validation)
 * @param {object} data - Request data
 * @returns {object} Validation result with isValid and errors
 */
function validateSignup(data) {
  const errors = [];

  if (!data.email) {
    errors.push('email or username is required');
  } else {
    const input = data.email.trim();

    // Check if it's an email or username
    if (isEmail(input)) {
      // Validate as email
      if (!isValidEmail(input)) {
        errors.push('email format is invalid');
      }
    } else {
      // Validate as username (minimum 6 characters)
      if (input.length < 6) {
        errors.push('username must be at least 6 characters long');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateSignup,
};

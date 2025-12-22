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
 * Validate signup request (email validation only)
 * @param {object} data - Request data
 * @returns {object} Validation result with isValid and errors
 */
function validateSignup(data) {
  const errors = [];

  if (!data.email) {
    errors.push('email is required');
  } else if (!isValidEmail(data.email)) {
    errors.push('email format is invalid');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateSignup,
};

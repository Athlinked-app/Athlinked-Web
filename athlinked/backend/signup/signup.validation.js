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
 * Validate date format (MM/DD/YYYY)
 * @param {string} dateStr - Date string
 * @returns {boolean} True if valid
 */
function isValidDate(dateStr) {
  if (!dateStr) return false;
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  if (!regex.test(dateStr)) return false;

  const [, month, day, year] = dateStr.match(regex);
  const date = new Date(`${year}-${month}-${day}`);
  
  return (
    date.getFullYear() == year &&
    date.getMonth() == month - 1 &&
    date.getDate() == day
  );
}

/**
 * Validate user type
 * @param {string} userType - User type
 * @returns {boolean} True if valid
 */
function isValidUserType(userType) {
  const validTypes = ['athlete', 'coach', 'organization'];
  return validTypes.includes(userType);
}

/**
 * Validate signup request
 * @param {object} data - Request data
 * @returns {object} Validation result with isValid and errors
 */
function validateSignup(data) {
  const errors = [];

  if (!data.user_type) {
    errors.push('user_type is required');
  } else if (!isValidUserType(data.user_type)) {
    errors.push('user_type must be one of: athlete, coach, organization');
  }

  if (!data.full_name || data.full_name.trim().length === 0) {
    errors.push('full_name is required');
  }

  if (!data.dob) {
    errors.push('dob is required');
  } else if (!isValidDate(data.dob)) {
    errors.push('dob must be in MM/DD/YYYY format');
  }

  if (!data.email) {
    errors.push('email is required');
  } else if (!isValidEmail(data.email)) {
    errors.push('email format is invalid');
  }

  if (!data.password) {
    errors.push('password is required');
  } else if (data.password.length < 6) {
    errors.push('password must be at least 6 characters');
  }

  if (data.user_type === 'athlete') {
    if (!data.sports_played) {
      errors.push('sports_played is required for athletes');
    }
    if (!data.primary_sport) {
      errors.push('primary_sport is required for athletes');
    }

    if (!data.parent_name || data.parent_name.trim().length === 0) {
      errors.push('parent_name is required for athletes');
    }

    if (!data.parent_email) {
      errors.push('parent_email is required for athletes');
    } else if (!isValidEmail(data.parent_email)) {
      errors.push('parent_email format is invalid');
    }

    if (!data.parent_dob) {
      errors.push('parent_dob is required for athletes');
    } else if (!isValidDate(data.parent_dob)) {
      errors.push('parent_dob must be in MM/DD/YYYY format');
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


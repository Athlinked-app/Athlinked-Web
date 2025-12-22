const pool = require('../config/db');

/**
 * Convert date string from MM/DD/YYYY to YYYY-MM-DD format
 * @param {string} dateStr - Date string in MM/DD/YYYY format
 * @returns {string|null} Date string in YYYY-MM-DD format or null
 */
function formatDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
  }
  return dateStr;
}

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<object|null>} User data or null
 */
async function findByEmail(email) {
  const query = 'SELECT * FROM users WHERE email = $1';
  const result = await pool.query(query, [email]);
  return result.rows[0] || null;
}

/**
 * Create user in database
 * @param {object} userData - User data object with hashed password
 * @returns {Promise<object>} Created user data
 */
async function createUser(userData) {
  const {
    user_type,
    full_name,
    dob,
    sports_played,
    primary_sport,
    email,
    password,
    parent_name,
    parent_email,
    parent_dob,
  } = userData;

  const sportsArray = Array.isArray(sports_played)
    ? sports_played
    : sports_played
      ? [sports_played]
      : null;

  const query = `
    INSERT INTO users (
      user_type,
      full_name,
      dob,
      sports_played,
      primary_sport,
      email,
      password,
      parent_name,
      parent_email,
      parent_dob
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id, email, full_name, user_type, created_at
  `;

  const values = [
    user_type,
    full_name,
    formatDate(dob),
    sportsArray,
    primary_sport || null,
    email,
    password,
    parent_name || null,
    parent_email || null,
    parent_dob ? formatDate(parent_dob) : null,
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new Error('Email already registered');
    }
    throw error;
  }
}

module.exports = {
  findByEmail,
  createUser,
};

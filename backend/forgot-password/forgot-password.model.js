const pool = require('../config/db');

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
 * Find user by username
 * @param {string} username - User username
 * @returns {Promise<object|null>} User data or null
 */
async function findByUsername(username) {
  const query = 'SELECT * FROM users WHERE username = $1';
  const result = await pool.query(query, [username]);
  return result.rows[0] || null;
}

/**
 * Update user password
 * @param {string} identifier - Email or username
 * @param {boolean} isEmail - Whether identifier is email
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<object>} Updated user data
 */
async function updatePassword(identifier, isEmail, hashedPassword) {
  const query = isEmail
    ? 'UPDATE users SET password = $1 WHERE email = $2 RETURNING id, email, username, full_name, user_type'
    : 'UPDATE users SET password = $1 WHERE username = $2 RETURNING id, email, username, full_name, user_type';

  const result = await pool.query(query, [
    hashedPassword,
    identifier.toLowerCase().trim(),
  ]);

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  return result.rows[0];
}

module.exports = {
  findByEmail,
  findByUsername,
  updatePassword,
};

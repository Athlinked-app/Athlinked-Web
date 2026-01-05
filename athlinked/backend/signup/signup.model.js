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
    username,
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
      username,
      password,
      parent_name,
      parent_email,
      parent_dob
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING id, email, username, full_name, user_type, created_at
  `;

  const values = [
    user_type,
    full_name,
    formatDate(dob),
    sportsArray,
    primary_sport || null,
    email || null, // Email can be null if username is used
    username ? username.toLowerCase() : null, // Username can be null if email is used
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
      if (error.constraint === 'users_email_key') {
        throw new Error('Email already registered');
      }
      if (error.constraint === 'users_username_key') {
        throw new Error('Username already taken');
      }
      throw new Error('Email or username already registered');
    }
    throw error;
  }
}

/**
 * Find user by ID
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} User data or null
 */
async function findById(userId) {
  const query = 'SELECT * FROM users WHERE id = $1';
  const result = await pool.query(query, [userId]);
  return result.rows[0] || null;
}

/**
 * Get all users excluding the current user
 * @param {string} excludeUserId - User ID to exclude from results
 * @param {number} limit - Maximum number of users to return (default: 10)
 * @returns {Promise<Array>} Array of user data
 */
async function getAllUsers(excludeUserId = null, limit = 10) {
  let query;
  let values;

  if (excludeUserId) {
    query = `
      SELECT id, full_name, username, email, user_type, profile_url, created_at
      FROM users
      WHERE id != $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    values = [excludeUserId, limit];
  } else {
    query = `
      SELECT id, full_name, username, email, user_type, profile_url, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT $1
    `;
    values = [limit];
  }

  const result = await pool.query(query, values);
  return result.rows;
}

/**
 * Get all children for a parent by parent email
 * @param {string} parentEmail - Parent's email address
 * @returns {Promise<Array>} Array of child user data
 */
async function getChildrenByParentEmail(parentEmail) {
  const query = `
    SELECT 
      id, 
      full_name, 
      username, 
      email, 
      user_type, 
      profile_url, 
      cover_url,
      dob,
      primary_sport,
      sports_played,
      created_at
    FROM users
    WHERE parent_email = $1 AND user_type != 'parent'
    ORDER BY created_at DESC
  `;
  
  const result = await pool.query(query, [parentEmail.toLowerCase().trim()]);
  return result.rows;
}

module.exports = {
  findByEmail,
  findByUsername,
  findById,
  createUser,
  getAllUsers,
  getChildrenByParentEmail,
};

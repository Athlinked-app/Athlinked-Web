const pool = require('../config/db');

/**
 * Store deleted account information
 * @param {object} accountData - Account data to store
 * @returns {Promise<object>} Stored deleted account data
 */
async function storeDeletedAccount(accountData) {
  const {
    email,
    username,
    full_name,
    user_type,
    deleted_at = new Date(),
  } = accountData;

  const query = `
    INSERT INTO deleted_accounts (
      email,
      username,
      full_name,
      user_type,
      deleted_at
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING id, email, username, full_name, user_type, deleted_at
  `;

  const values = [
    email || null,
    username || null,
    full_name || null,
    user_type || null,
    deleted_at,
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error storing deleted account:', error);
    throw error;
  }
}

/**
 * Find deleted account by email
 * @param {string} email - Email to search for
 * @returns {Promise<object|null>} Deleted account data or null
 */
async function findDeletedAccountByEmail(email) {
  const query = `
    SELECT * FROM deleted_accounts 
    WHERE email = $1 
    ORDER BY deleted_at DESC 
    LIMIT 1
  `;
  const result = await pool.query(query, [email.toLowerCase().trim()]);
  return result.rows[0] || null;
}

/**
 * Find deleted account by username
 * @param {string} username - Username to search for
 * @returns {Promise<object|null>} Deleted account data or null
 */
async function findDeletedAccountByUsername(username) {
  const query = `
    SELECT * FROM deleted_accounts 
    WHERE username = $1 
    ORDER BY deleted_at DESC 
    LIMIT 1
  `;
  const result = await pool.query(query, [username.toLowerCase().trim()]);
  return result.rows[0] || null;
}

/**
 * Check if account was deleted recently (within last 30 days)
 * @param {string} emailOrUsername - Email or username to check
 * @returns {Promise<object|null>} Deleted account data if recently deleted, null otherwise
 */
async function findRecentlyDeletedAccount(emailOrUsername) {
  const normalizedInput = emailOrUsername.toLowerCase().trim();
  const isEmail = normalizedInput.includes('@');

  let deletedAccount;
  if (isEmail) {
    deletedAccount = await findDeletedAccountByEmail(normalizedInput);
  } else {
    deletedAccount = await findDeletedAccountByUsername(normalizedInput);
  }

  if (!deletedAccount) {
    return null;
  }

  // Check if deleted within last 30 days
  const deletedAt = new Date(deletedAccount.deleted_at);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  if (deletedAt >= thirtyDaysAgo) {
    return deletedAccount;
  }

  return null;
}

module.exports = {
  storeDeletedAccount,
  findDeletedAccountByEmail,
  findDeletedAccountByUsername,
  findRecentlyDeletedAccount,
};

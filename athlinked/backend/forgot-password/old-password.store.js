/**
 * In-memory storage for old password hashes after password reset
 * Structure: userId → { oldPasswordHash, changedAt, expiresAt }
 */
const oldPasswordStore = new Map();

/**
 * Store old password hash with expiration
 * @param {number} userId - User ID
 * @param {string} oldPasswordHash - Old password hash
 * @param {number} expiresInHours - Expiration time in hours (default: 24)
 */
function storeOldPassword(userId, oldPasswordHash, expiresInHours = 24) {
  const expiresAt = Date.now() + expiresInHours * 60 * 60 * 1000;
  const changedAt = Date.now();

  oldPasswordStore.set(userId, {
    oldPasswordHash,
    changedAt,
    expiresAt,
  });
}

/**
 * Get old password hash by user ID
 * @param {number} userId - User ID
 * @returns {object|null} Old password data or null if not found/expired
 */
function getOldPassword(userId) {
  const stored = oldPasswordStore.get(userId);

  if (!stored) {
    return null;
  }

  const now = Date.now();
  if (now > stored.expiresAt) {
    oldPasswordStore.delete(userId);
    return null;
  }

  return stored;
}

/**
 * Delete old password entry
 * @param {number} userId - User ID
 */
function deleteOldPassword(userId) {
  oldPasswordStore.delete(userId);
}

/**
 * Clean expired old password entries (optional cleanup function)
 */
function cleanExpiredOldPasswords() {
  const now = Date.now();
  let cleaned = 0;

  for (const [userId, data] of oldPasswordStore.entries()) {
    if (now > data.expiresAt) {
      oldPasswordStore.delete(userId);
      cleaned++;
    }
  }

  return cleaned;
}

module.exports = {
  storeOldPassword,
  getOldPassword,
  deleteOldPassword,
  cleanExpiredOldPasswords,
};


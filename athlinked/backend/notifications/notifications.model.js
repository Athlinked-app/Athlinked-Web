const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Get notifications for a user
 * @param {string} recipientUserId - User ID to fetch notifications for
 * @param {number} limit - Maximum number of notifications to return
 * @param {number} offset - Number of notifications to skip
 * @returns {Promise<Array>} Array of notifications
 */
async function getNotifications(recipientUserId, limit = 20, offset = 0) {
  const query = `
    SELECT 
      id,
      recipient_user_id,
      actor_user_id,
      actor_full_name,
      type,
      entity_type,
      entity_id,
      message,
      is_read,
      created_at
    FROM notifications
    WHERE recipient_user_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `;

  try {
    const result = await pool.query(query, [recipientUserId, limit, offset]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

/**
 * Get unread notification count for a user
 * @param {string} recipientUserId - User ID
 * @returns {Promise<number>} Count of unread notifications
 */
async function getUnreadCount(recipientUserId) {
  const query = `
    SELECT COUNT(*) as count
    FROM notifications
    WHERE recipient_user_id = $1 AND is_read = false
  `;

  try {
    const result = await pool.query(query, [recipientUserId]);
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    console.error('Error fetching unread count:', error);
    throw error;
  }
}

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ID
 * @param {string} recipientUserId - User ID (for security check)
 * @returns {Promise<object|null>} Updated notification or null if not found
 */
async function markAsRead(notificationId, recipientUserId) {
  const query = `
    UPDATE notifications
    SET is_read = true
    WHERE id = $1 AND recipient_user_id = $2
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [notificationId, recipientUserId]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 * @param {string} recipientUserId - User ID
 * @returns {Promise<number>} Number of notifications updated
 */
async function markAllAsRead(recipientUserId) {
  const query = `
    UPDATE notifications
    SET is_read = true
    WHERE recipient_user_id = $1 AND is_read = false
    RETURNING id
  `;

  try {
    const result = await pool.query(query, [recipientUserId]);
    return result.rowCount;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Create a new notification
 * @param {object} notificationData - Notification data
 * @param {string} notificationData.recipientUserId - Recipient user ID
 * @param {string} [notificationData.actorUserId] - Actor user ID (nullable)
 * @param {string} notificationData.actorFullName - Actor's full name
 * @param {string} notificationData.type - Notification type (like, comment, mention, follow_request, follow_accepted)
 * @param {string} notificationData.entityType - Entity type (post, comment, profile, clip)
 * @param {string} notificationData.entityId - Entity ID
 * @param {string} notificationData.message - Pre-built message text
 * @returns {Promise<object>} Created notification
 */
async function createNotification(notificationData) {
  const {
    recipientUserId,
    actorUserId,
    actorFullName,
    type,
    entityType,
    entityId,
    message,
  } = notificationData;

  // Validate required fields
  if (
    !recipientUserId ||
    !actorFullName ||
    !type ||
    !entityType ||
    !entityId ||
    !message
  ) {
    throw new Error('Missing required notification fields');
  }

  // Validate notification type
  const validTypes = [
    'like',
    'comment',
    'mention',
    'follow_request',
    'follow_accepted',
  ];
  if (!validTypes.includes(type)) {
    throw new Error(`Invalid notification type: ${type}`);
  }

  const id = uuidv4();
  const query = `
    INSERT INTO notifications (
      id,
      recipient_user_id,
      actor_user_id,
      actor_full_name,
      type,
      entity_type,
      entity_id,
      message,
      is_read,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [
      id,
      recipientUserId,
      actorUserId || null,
      actorFullName,
      type,
      entityType,
      entityId,
      message,
      false, // is_read defaults to false
    ]);

    console.log('Notification created in database:', {
      id: result.rows[0].id,
      recipientUserId,
      type,
      message,
    });

    return result.rows[0];
  } catch (error) {
    console.error('Error creating notification in database:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
    });
    throw error;
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
};

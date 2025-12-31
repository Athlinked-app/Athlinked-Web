const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Get user profile by user ID
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} Profile data with user full_name
 */
async function getUserProfile(userId) {
  const query = `
    SELECT 
      up.id,
      up.user_id,
      up.full_name,
      up.profile_image_url,
      up.cover_image_url,
      up.bio,
      up.education,
      up.city,
      up.primary_sport,
      up.created_at,
      up.updated_at,
      u.sports_played
    FROM user_profiles up
    LEFT JOIN users u ON up.user_id = u.id
    WHERE up.user_id = $1
  `;

  try {
    const result = await pool.query(query, [userId]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Create or update user profile (UPSERT)
 * @param {string} userId - User ID
 * @param {object} profileData - Profile data to save
 * @param {string} [profileData.fullName] - Full name
 * @param {string} [profileData.profileImageUrl] - Profile image URL
 * @param {string} [profileData.coverImageUrl] - Cover image URL
 * @param {string} [profileData.bio] - Bio text
 * @param {string} [profileData.education] - Education text
 * @param {string} [profileData.primarySport] - Primary sport
 * @returns {Promise<object>} Created/updated profile
 */
async function upsertUserProfile(userId, profileData) {
  const dbClient = await pool.connect();
  try {
    console.log('=== UPSERT PROFILE START ===');
    console.log('UserId:', userId);
    console.log('ProfileData:', JSON.stringify(profileData, null, 2));

    await dbClient.query('BEGIN');

    const id = uuidv4();
    const insertFields = ['id', 'user_id'];
    const insertValues = [id, userId];
    const conflictUpdateFields = [];

    // Build INSERT and UPDATE clauses dynamically based on provided fields
    if (profileData.fullName !== undefined) {
      insertFields.push('full_name');
      insertValues.push(profileData.fullName || null);
      conflictUpdateFields.push('full_name = EXCLUDED.full_name');
    }
    if (profileData.profileImageUrl !== undefined) {
      insertFields.push('profile_image_url');
      insertValues.push(profileData.profileImageUrl || null);
      conflictUpdateFields.push(
        'profile_image_url = EXCLUDED.profile_image_url'
      );
    }
    if (profileData.coverImageUrl !== undefined) {
      insertFields.push('cover_image_url');
      insertValues.push(profileData.coverImageUrl || null);
      conflictUpdateFields.push('cover_image_url = EXCLUDED.cover_image_url');
    }
    if (profileData.bio !== undefined) {
      insertFields.push('bio');
      insertValues.push(profileData.bio || null);
      conflictUpdateFields.push('bio = EXCLUDED.bio');
    }
    if (profileData.education !== undefined) {
      insertFields.push('education');
      insertValues.push(profileData.education || null);
      conflictUpdateFields.push('education = EXCLUDED.education');
    }
    if (profileData.city !== undefined) {
      insertFields.push('city');
      insertValues.push(profileData.city || null);
      conflictUpdateFields.push('city = EXCLUDED.city');
    }
    if (profileData.primarySport !== undefined) {
      insertFields.push('primary_sport');
      insertValues.push(profileData.primarySport || null);
      conflictUpdateFields.push('primary_sport = EXCLUDED.primary_sport');
    }

    // If no fields provided, at least update the updated_at timestamp
    if (conflictUpdateFields.length === 0) {
      console.log(
        'WARNING: No profile fields provided, only updating timestamp'
      );
    }

    // Build placeholders for INSERT
    const insertPlaceholders = insertValues
      .map((_, idx) => `$${idx + 1}`)
      .join(', ');

    // Use INSERT ... ON CONFLICT DO UPDATE for UPSERT
    // For created_at, we preserve existing value on update, or use NOW() on insert
    let updateClause =
      'created_at = user_profiles.created_at, updated_at = NOW()';
    if (conflictUpdateFields.length > 0) {
      updateClause = conflictUpdateFields.join(', ') + ', ' + updateClause;
    }

    const upsertQuery = `
      INSERT INTO user_profiles (${insertFields.join(', ')}, created_at, updated_at)
      VALUES (${insertPlaceholders}, NOW(), NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        ${updateClause}
      RETURNING *
    `;

    console.log('SQL Query:', upsertQuery);
    console.log('Query Values:', insertValues);
    console.log('Insert Fields:', insertFields);
    console.log('Conflict Update Fields:', conflictUpdateFields);

    const result = await dbClient.query(upsertQuery, insertValues);

    console.log('Query executed successfully');
    console.log('Rows affected:', result.rowCount);
    console.log('Returned data:', result.rows[0]);

    // Update sports_played in users table if provided
    if (profileData.sportsPlayed !== undefined) {
      // Convert comma-separated string to PostgreSQL array format
      let sportsArray = [];
      if (profileData.sportsPlayed && profileData.sportsPlayed.trim() !== '') {
        sportsArray = profileData.sportsPlayed
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      }

      // Update users table with sports_played array
      // PostgreSQL accepts JavaScript arrays directly for array columns
      const updateUsersQuery = `
        UPDATE users
        SET sports_played = $1, updated_at = NOW()
        WHERE id = $2
      `;

      // Pass the array directly - PostgreSQL will handle the conversion
      await dbClient.query(updateUsersQuery, [
        sportsArray.length > 0 ? sportsArray : null,
        userId,
      ]);

      console.log('Updated sports_played in users table:', sportsArray);
    }

    await dbClient.query('COMMIT');
    console.log('Transaction committed');

    // Fetch the updated profile with sports_played from users table
    const finalProfile = await getUserProfile(userId);

    console.log('=== UPSERT PROFILE SUCCESS ===');
    return finalProfile || result.rows[0];
  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error('=== UPSERT PROFILE ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    console.error('Error hint:', error.hint);
    console.error('Full error:', error);
    throw error;
  } finally {
    dbClient.release();
    console.log('Database client released');
  }
}

/**
 * Update only profile images
 * @param {string} userId - User ID
 * @param {object} imageData - Image URLs
 * @param {string} [imageData.profileImageUrl] - Profile image URL
 * @param {string} [imageData.coverImageUrl] - Cover image URL
 * @returns {Promise<object>} Updated profile
 */
async function updateProfileImages(userId, imageData) {
  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

    // Check if profile exists
    const checkQuery = 'SELECT id FROM user_profiles WHERE user_id = $1';
    const checkResult = await dbClient.query(checkQuery, [userId]);

    if (checkResult.rows.length === 0) {
      // Insert new profile with only images
      const id = uuidv4();
      const insertQuery = `
        INSERT INTO user_profiles (
          id, user_id, profile_image_url, cover_image_url, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING *
      `;
      const insertResult = await dbClient.query(insertQuery, [
        id,
        userId,
        imageData.profileImageUrl || null,
        imageData.coverImageUrl || null,
      ]);
      await dbClient.query('COMMIT');
      return insertResult.rows[0];
    } else {
      // Update only image fields
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      if (imageData.profileImageUrl !== undefined) {
        updateFields.push(`profile_image_url = $${paramIndex++}`);
        updateValues.push(imageData.profileImageUrl || null);
      }
      if (imageData.coverImageUrl !== undefined) {
        updateFields.push(`cover_image_url = $${paramIndex++}`);
        updateValues.push(imageData.coverImageUrl || null);
      }

      // Always update updated_at
      updateFields.push(`updated_at = NOW()`);
      updateValues.push(userId);

      const updateQuery = `
        UPDATE user_profiles
        SET ${updateFields.join(', ')}
        WHERE user_id = $${paramIndex}
        RETURNING *
      `;
      const updateResult = await dbClient.query(updateQuery, updateValues);
      await dbClient.query('COMMIT');
      return updateResult.rows[0];
    }
  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error('Error updating profile images:', error);
    throw error;
  } finally {
    dbClient.release();
  }
}

module.exports = {
  getUserProfile,
  upsertUserProfile,
  updateProfileImages,
};

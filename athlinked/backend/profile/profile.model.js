const pool = require('../config/db');

/**
 * Get user profile by user ID
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} Profile data with user full_name
 */
async function getUserProfile(userId) {
    // Fetch all data from users table only
    const query = `
    SELECT 
      u.id as user_id,
      u.full_name,
      u.profile_url as profile_image_url,
      u.cover_url as cover_image_url,
      u.bio,
      u.education,
      u.city,
      u.primary_sport,
      u.sports_played,
      u.created_at,
      u.updated_at
    FROM users u
    WHERE u.id = $1
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

    // Update users table with all profile data (profile_url, cover_url, education, bio, city, sports_played, primary_sport, full_name)
    const usersUpdateFields = [];
    const usersUpdateValues = [];
    let usersParamIndex = 1;

    if (profileData.fullName !== undefined) {
      usersUpdateFields.push(`full_name = $${usersParamIndex++}`);
      usersUpdateValues.push(profileData.fullName || null);
    }
    if (profileData.profileImageUrl !== undefined) {
      usersUpdateFields.push(`profile_url = $${usersParamIndex++}`);
      usersUpdateValues.push(profileData.profileImageUrl || null);
    }
    if (profileData.coverImageUrl !== undefined) {
      usersUpdateFields.push(`cover_url = $${usersParamIndex++}`);
      usersUpdateValues.push(profileData.coverImageUrl || null);
    }
    if (profileData.education !== undefined) {
      usersUpdateFields.push(`education = $${usersParamIndex++}`);
      usersUpdateValues.push(profileData.education || null);
    }
    if (profileData.bio !== undefined) {
      usersUpdateFields.push(`bio = $${usersParamIndex++}`);
      usersUpdateValues.push(profileData.bio || null);
    }
    if (profileData.city !== undefined) {
      usersUpdateFields.push(`city = $${usersParamIndex++}`);
      usersUpdateValues.push(profileData.city || null);
    }
    if (profileData.primarySport !== undefined) {
      usersUpdateFields.push(`primary_sport = $${usersParamIndex++}`);
      usersUpdateValues.push(profileData.primarySport || null);
    }
    if (profileData.sportsPlayed !== undefined) {
      // Convert comma-separated string to PostgreSQL array format
      let sportsArray = [];
      if (profileData.sportsPlayed && profileData.sportsPlayed.trim() !== '') {
        sportsArray = profileData.sportsPlayed
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      }
      usersUpdateFields.push(`sports_played = $${usersParamIndex++}`);
      usersUpdateValues.push(sportsArray.length > 0 ? sportsArray : null);
    }

    // Update users table if there are fields to update
    if (usersUpdateFields.length > 0) {
      usersUpdateFields.push(`updated_at = NOW()`);
      usersUpdateValues.push(userId);

      const updateUsersQuery = `
        UPDATE users
        SET ${usersUpdateFields.join(', ')}
        WHERE id = $${usersParamIndex}
        RETURNING *
      `;

      const result = await dbClient.query(updateUsersQuery, usersUpdateValues);
      console.log('Updated users table with profile data:', {
        full_name: profileData.fullName,
        profile_url: profileData.profileImageUrl,
        cover_url: profileData.coverImageUrl,
        education: profileData.education,
        bio: profileData.bio,
        city: profileData.city,
        primary_sport: profileData.primarySport,
        sports_played: profileData.sportsPlayed,
      });
      console.log('Query executed successfully');
      console.log('Rows affected:', result.rowCount);
      console.log('Returned data:', result.rows[0]);
    } else {
      console.log('WARNING: No profile fields provided to update');
    }

    await dbClient.query('COMMIT');
    console.log('Transaction committed');

    // Fetch the updated profile from users table
    const finalProfile = await getUserProfile(userId);

    console.log('=== UPSERT PROFILE SUCCESS ===');
    return finalProfile;
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

    // Update users table with image URLs
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (imageData.profileImageUrl !== undefined) {
      updateFields.push(`profile_url = $${paramIndex++}`);
      updateValues.push(imageData.profileImageUrl || null);
    }
    if (imageData.coverImageUrl !== undefined) {
      updateFields.push(`cover_url = $${paramIndex++}`);
      updateValues.push(imageData.coverImageUrl || null);
    }

    // Always update updated_at
    updateFields.push(`updated_at = NOW()`);
    updateValues.push(userId);

    const updateQuery = `
      UPDATE users
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    const updateResult = await dbClient.query(updateQuery, updateValues);
    await dbClient.query('COMMIT');
    return updateResult.rows[0];
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

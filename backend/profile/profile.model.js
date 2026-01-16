const pool = require('../config/db');

async function getUserProfile(userId) {
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
      u.dob,
      u.user_type,
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

async function getCurrentUserProfile(userId) {
  const query = `
    SELECT 
      u.id,
      u.email,
      u.username,
      u.full_name,
      u.profile_url,
      u.cover_url,
      u.bio,
      u.education,
      u.city,
      u.primary_sport,
      u.sports_played,
      u.dob,
      u.user_type,
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
    console.error('Error fetching current user profile:', error);
    throw error;
  }
}

async function upsertUserProfile(userId, profileData) {
  const dbClient = await pool.connect();
  try {
    console.log('=== UPSERT PROFILE START ===');
    console.log('UserId:', userId);
    console.log('ProfileData:', JSON.stringify(profileData, null, 2));

    await dbClient.query('BEGIN');

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
      // Allow empty strings to be saved (don't convert to null)
      usersUpdateValues.push(profileData.education === '' ? null : profileData.education);
    }
    if (profileData.bio !== undefined) {
      usersUpdateFields.push(`bio = $${usersParamIndex++}`);
      // Allow empty strings to be saved (don't convert to null)
      usersUpdateValues.push(profileData.bio === '' ? null : profileData.bio);
    }
    if (profileData.city !== undefined) {
      usersUpdateFields.push(`city = $${usersParamIndex++}`);
      // Allow empty strings to be saved (don't convert to null)
      usersUpdateValues.push(profileData.city === '' ? null : profileData.city);
    }
    if (profileData.primarySport !== undefined) {
      usersUpdateFields.push(`primary_sport = $${usersParamIndex++}`);
      // Allow empty strings to be saved (don't convert to null)
      usersUpdateValues.push(profileData.primarySport === '' ? null : profileData.primarySport);
    }
    if (profileData.sportsPlayed !== undefined) {
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

    if (usersUpdateFields.length > 0) {
      usersUpdateFields.push(`updated_at = NOW()`);
      usersUpdateValues.push(userId);

      const updateUsersQuery = `
        UPDATE users
        SET ${usersUpdateFields.join(', ')}
        WHERE id = $${usersParamIndex}
        RETURNING *
      `;

      console.log('=== DATABASE: Executing UPDATE query ===');
      console.log('SQL Query:', updateUsersQuery);
      console.log('Parameter count:', usersUpdateValues.length);
      console.log('With values:', usersUpdateValues.map((v, i) => {
        if (v === null) return `$${i + 1} = NULL`;
        if (typeof v === 'string') return `$${i + 1} = '${v.length > 50 ? v.substring(0, 50) + '...' : v}'`;
        if (Array.isArray(v)) return `$${i + 1} = [${v.join(', ')}]`;
        return `$${i + 1} = ${v}`;
      }));

      const result = await dbClient.query(updateUsersQuery, usersUpdateValues);
      
      console.log('=== DATABASE: Query Execution Result ===');
      console.log('Rows affected:', result.rowCount);
      console.log('Returned row count:', result.rows.length);
      
      if (result.rowCount === 0) {
        console.error('=== DATABASE ERROR: UPDATE query affected 0 rows ===');
        console.error('User ID:', userId);
        console.error('This means the user might not exist or the WHERE clause did not match');
        throw new Error('User not found or update failed');
      }
      
      console.log('=== DATABASE: Update successful ===');
      console.log('Updated fields:', {
        full_name: profileData.fullName,
        profile_url: profileData.profileImageUrl,
        cover_url: profileData.coverImageUrl,
        education: profileData.education,
        bio: profileData.bio,
        city: profileData.city,
        primary_sport: profileData.primarySport,
        sports_played: profileData.sportsPlayed,
      });
      console.log('Returned user data:', {
        id: result.rows[0]?.id,
        full_name: result.rows[0]?.full_name,
        bio: result.rows[0]?.bio,
        education: result.rows[0]?.education,
        city: result.rows[0]?.city,
        sports_played: result.rows[0]?.sports_played,
        primary_sport: result.rows[0]?.primary_sport,
      });
    } else {
      console.log('WARNING: No profile fields provided to update');
      throw new Error('No profile fields provided to update');
    }

    await dbClient.query('COMMIT');
    console.log('Transaction committed successfully');

    const finalProfile = await getUserProfile(userId);
    
    if (!finalProfile) {
      console.error('ERROR: Could not retrieve updated profile after commit');
      throw new Error('Failed to retrieve updated profile');
    }

    console.log('=== UPSERT PROFILE SUCCESS ===');
    console.log('Final profile data:', {
      bio: finalProfile.bio,
      education: finalProfile.education,
      city: finalProfile.city,
      sports_played: finalProfile.sports_played,
    });
    return finalProfile;
  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error('=== UPSERT PROFILE ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    console.error('Error hint:', error.hint);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    throw error;
  } finally {
    dbClient.release();
    console.log('Database client released');
  }
}

async function updateProfileImages(userId, imageData) {
  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

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

/**
 * Get user profile with athletic performance and sports with IDs (optimized for stats page)
 * This combines user data, athletic performance, and sports with IDs in a single query
 * @param {string} userId - User ID
 * @param {string} activeSport - Optional active sport to filter athletic performance
 * @returns {Promise<object|null>} Combined user data with athletic performance and sports
 */
async function getUserProfileWithStats(userId, activeSport = null) {
  try {
    // Get user data
    const userQuery = `
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
        u.dob,
        u.user_type
      FROM users u
      WHERE u.id = $1
    `;
    
    const userResult = await pool.query(userQuery, [userId]);
    if (userResult.rows.length === 0) {
      return null;
    }
    
    const userData = userResult.rows[0];
    
    // Get athletic performance (filtered by active sport if provided)
    let athleticPerfQuery = `
      SELECT 
        ap.id,
        ap.height,
        ap.weight,
        ap.hand,
        ap.arm,
        ap.jersey_number,
        ap.sport,
        ap.created_at
      FROM athletic_performance ap
      WHERE ap.user_id = $1
      ORDER BY 
    `;
    
    const athleticPerfParams = [userId];
    if (activeSport) {
      athleticPerfQuery += `
        CASE WHEN LOWER(ap.sport) = LOWER($2) THEN 0 ELSE 1 END,
      `;
      athleticPerfParams.push(activeSport);
    }
    athleticPerfQuery += ` ap.created_at DESC LIMIT 1`;
    
    const athleticPerfResult = await pool.query(athleticPerfQuery, athleticPerfParams);
    const athleticPerformance = athleticPerfResult.rows.length > 0 ? athleticPerfResult.rows[0] : null;
    
    // Parse sports_played to get sport names array
    let sportsPlayedArray = [];
    if (userData.sports_played) {
      if (Array.isArray(userData.sports_played)) {
        sportsPlayedArray = userData.sports_played.filter(Boolean);
      } else if (typeof userData.sports_played === 'string') {
        let sportsString = userData.sports_played.trim();
        if (sportsString.startsWith('{') && sportsString.endsWith('}')) {
          sportsString = sportsString.slice(1, -1);
        }
        sportsString = sportsString.replace(/["']/g, '');
        sportsPlayedArray = sportsString.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    
    // Get sports with IDs by matching with sports_played
    let sports = [];
    if (sportsPlayedArray.length > 0) {
      // Get all sports from database
      const allSportsQuery = `SELECT id, name FROM sports ORDER BY name ASC`;
      const allSportsResult = await pool.query(allSportsQuery);
      const allSports = allSportsResult.rows;
      
      // Create a map for case-insensitive matching (handles "Basketball" vs "Basket Ball")
      const sportsMap = new Map();
      allSports.forEach(row => {
        const normalizedName = row.name.toLowerCase().replace(/\s+/g, '');
        sportsMap.set(normalizedName, { id: row.id, name: row.name });
      });
      
      // Match sports_played order, using normalized names for matching
      sports = sportsPlayedArray.map(sportName => {
        const normalizedSportName = sportName.toLowerCase().replace(/\s+/g, '');
        
        // Find matching sport (case-insensitive, ignore spaces)
        for (const [normalized, sportData] of sportsMap.entries()) {
          if (normalized === normalizedSportName) {
            return sportData;
          }
        }
        
        // If not found in database, return with null id
        return { id: null, name: sportName };
      }).filter(Boolean);
    } else {
      // If no sports_played, return all sports as fallback
      const allSportsQuery = `SELECT id, name FROM sports ORDER BY name ASC`;
      const allSportsResult = await pool.query(allSportsQuery);
      sports = allSportsResult.rows.map(row => ({
        id: row.id,
        name: row.name,
      }));
    }
    
    // Parse sports_played for display
    let sportsPlayed = null;
    if (sportsPlayedArray.length > 0) {
      sportsPlayed = sportsPlayedArray.join(', ');
    }
    
    return {
      user_id: userData.user_id,
      full_name: userData.full_name,
      profile_image_url: userData.profile_image_url,
      cover_image_url: userData.cover_image_url,
      bio: userData.bio,
      education: userData.education,
      city: userData.city,
      primary_sport: userData.primary_sport,
      sports_played: sportsPlayed,
      sports_played_array: sportsPlayedArray,
      dob: userData.dob,
      user_type: userData.user_type,
      athletic_performance: athleticPerformance ? {
        id: athleticPerformance.id,
        height: athleticPerformance.height,
        weight: athleticPerformance.weight,
        hand: athleticPerformance.hand,
        arm: athleticPerformance.arm,
        jerseyNumber: athleticPerformance.jersey_number,
        sport: athleticPerformance.sport,
      } : null,
      sports: sports,
    };
  } catch (error) {
    console.error('Error fetching user profile with stats:', error);
    throw error;
  }
}

module.exports = {
  getUserProfile,
  upsertUserProfile,
  updateProfileImages,
  getCurrentUserProfile,
  getUserProfileWithStats,
};

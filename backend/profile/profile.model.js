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
    try {
      await dbClient.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
    console.error('=== UPSERT PROFILE ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    console.error('Error hint:', error.hint);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    throw error;
  } finally {
    if (dbClient) {
      try {
        dbClient.release();
        console.log('Database client released');
      } catch (releaseError) {
        console.error('Error releasing database connection:', releaseError);
      }
    }
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
    try {
      await dbClient.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
    console.error('Error updating profile images:', error);
    throw error;
  } finally {
    if (dbClient) {
      try {
        dbClient.release();
      } catch (releaseError) {
        console.error('Error releasing database connection:', releaseError);
      }
    }
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

/**
 * Get complete user profile with all sections using minimal database queries
 * Uses PostgreSQL JSON aggregation to combine all data in 1-2 queries
 * @param {string} userId - User ID
 * @param {string} currentUserId - Current logged-in user ID (optional)
 * @returns {Promise<object|null>} Complete profile data
 */
async function getUserProfileComplete(userId, currentUserId = null) {
  try {
    // Build connection status part of query
    let connectionStatusQuery = 'CAST(NULL AS TEXT) as connection_status';
    const queryParams = [userId];
    
    if (currentUserId && currentUserId !== userId) {
      connectionStatusQuery = `
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM user_connections 
            WHERE (user_id_1 = $2 AND user_id_2 = u.id) 
            OR (user_id_1 = u.id AND user_id_2 = $2)
          ) THEN 'connected'
          WHEN EXISTS (
            SELECT 1 FROM connection_requests 
            WHERE requester_id = $2 AND receiver_id = u.id AND status = 'pending'
          ) THEN 'pending'
          WHEN EXISTS (
            SELECT 1 FROM connection_requests 
            WHERE requester_id = u.id AND receiver_id = $2 AND status = 'pending'
          ) THEN 'received'
          ELSE NULL
        END as connection_status
      `;
      queryParams.push(currentUserId);
    }

    // SINGLE QUERY using JSON aggregation and subqueries
    const completeQuery = `
      WITH user_data AS (
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
          u.username,
          u.email,
          -- Follow counts as subqueries
          (SELECT COUNT(*) FROM user_follows WHERE following_id = u.id) as followers_count,
          (SELECT COUNT(*) FROM user_follows WHERE follower_id = u.id) as following_count,
          -- Connection status as subquery (if viewing another user)
          ${connectionStatusQuery}
        FROM users u
        WHERE u.id = $1
      ),
      profile_sections AS (
        SELECT 
          -- Social Handles as JSON array
          COALESCE(
            (SELECT json_agg(json_build_object(
              'id', id,
              'user_id', user_id,
              'platform', platform,
              'url', url,
              'created_at', created_at,
              'updated_at', updated_at
            ) ORDER BY created_at DESC) FROM social_handles WHERE user_id = $1),
            '[]'::json
          ) as social_handles,
          
          -- Academic Backgrounds as JSON array
          COALESCE(
            (SELECT json_agg(json_build_object(
              'id', id,
              'user_id', user_id,
              'school', school,
              'degree', degree,
              'qualification', qualification,
              'start_date', start_date,
              'end_date', end_date,
              'degree_pdf', degree_pdf,
              'academic_gpa', academic_gpa,
              'sat_act_score', sat_act_score,
              'academic_honors', academic_honors,
              'college_eligibility_status', college_eligibility_status,
              'graduation_year', graduation_year,
              'primary_state_region', primary_state_region,
              'preferred_college_regions', preferred_college_regions,
              'willingness_to_relocate', willingness_to_relocate,
              'gender', gender,
              'created_at', created_at,
              'updated_at', updated_at
            ) ORDER BY created_at DESC) FROM academic_backgrounds WHERE user_id = $1),
            '[]'::json
          ) as academic_backgrounds,
          
          -- Achievements as JSON array
          COALESCE(
            (SELECT json_agg(json_build_object(
              'id', id,
              'user_id', user_id,
              'title', title,
              'organization', organization,
              'date_awarded', date_awarded,
              'sport', sport,
              'position_event', position_event,
              'achievement_type', achievement_type,
              'level', level,
              'location', location,
              'description', description,
              'media_pdf', media_pdf,
              'created_at', created_at,
              'updated_at', updated_at
            ) ORDER BY created_at DESC) FROM achievements WHERE user_id = $1),
            '[]'::json
          ) as achievements,
          
          -- Athletic Performance as JSON array
          COALESCE(
            (SELECT json_agg(json_build_object(
              'id', id,
              'user_id', user_id,
              'height', height,
              'weight', weight,
              'sport', sport,
              'athlete_handedness', athlete_handedness,
              'dominant_side_or_foot', dominant_side_or_foot,
              'jersey_number', jersey_number,
              'training_hours_per_week', training_hours_per_week,
              'multi_sport_athlete', multi_sport_athlete,
              'coach_verified_profile', coach_verified_profile,
              'hand', hand,
              'arm', arm,
              'created_at', created_at,
              'updated_at', updated_at
            ) ORDER BY created_at DESC) FROM athletic_performance WHERE user_id = $1),
            '[]'::json
          ) as athletic_performance,
          
          -- Competition Clubs as JSON array
          COALESCE(
            (SELECT json_agg(json_build_object(
              'id', id,
              'user_id', user_id,
              'club_or_travel_team_name', club_or_travel_team_name,
              'team_level', team_level,
              'league_or_organization_name', league_or_organization_name,
              'tournament_participation', tournament_participation,
              'created_at', created_at,
              'updated_at', updated_at
            ) ORDER BY created_at DESC) FROM competition_clubs WHERE user_id = $1),
            '[]'::json
          ) as competition_clubs,
          
          -- Character Leadership as JSON array
          COALESCE(
            (SELECT json_agg(json_build_object(
              'id', id,
              'user_id', user_id,
              'team_captain', team_captain,
              'leadership_roles', leadership_roles,
              'languages_spoken', languages_spoken,
              'community_service', community_service,
              'created_at', created_at,
              'updated_at', updated_at
            ) ORDER BY created_at DESC) FROM character_leadership WHERE user_id = $1),
            '[]'::json
          ) as character_leadership,
          
          -- Health Readiness as JSON array
          COALESCE(
            (SELECT json_agg(json_build_object(
              'id', id,
              'user_id', user_id,
              'injury_history', injury_history,
              'resting_heart_rate', resting_heart_rate,
              'endurance_metric', endurance_metric,
              'created_at', created_at,
              'updated_at', updated_at
            ) ORDER BY created_at DESC) FROM health_readiness WHERE user_id = $1),
            '[]'::json
          ) as health_readiness,
          
          -- Video Media as JSON array
          COALESCE(
            (SELECT json_agg(json_build_object(
              'id', id,
              'user_id', user_id,
              'highlight_video_link', highlight_video_link,
              'video_status', video_status,
              'verified_media_profile', verified_media_profile,
              'created_at', created_at,
              'updated_at', updated_at
            ) ORDER BY created_at DESC) FROM video_media WHERE user_id = $1),
            '[]'::json
          ) as video_media
      )
      SELECT 
        ud.*,
        ps.social_handles,
        ps.academic_backgrounds,
        ps.achievements,
        ps.athletic_performance,
        ps.competition_clubs,
        ps.character_leadership,
        ps.health_readiness,
        ps.video_media
      FROM user_data ud
      CROSS JOIN profile_sections ps
    `;

    console.log('Executing getUserProfileComplete query for userId:', userId, 'currentUserId:', currentUserId);
    console.log('Query params:', queryParams);
    
    const result = await pool.query(completeQuery, queryParams);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    // Process sports_played
    let sportsPlayed = null;
    if (row.sports_played) {
      if (Array.isArray(row.sports_played)) {
        sportsPlayed = row.sports_played.join(', ');
      } else if (typeof row.sports_played === 'string') {
        let sportsString = row.sports_played.trim();
        if (sportsString.startsWith('{') && sportsString.endsWith('}')) {
          sportsString = sportsString.slice(1, -1);
        }
        sportsString = sportsString.replace(/["']/g, '');
        sportsPlayed = sportsString;
      }
    }

    // Process connection status
    let connectionStatus = null;
    if (row.connection_status) {
      connectionStatus = {
        exists: true,
        status: row.connection_status
      };
    }

    return {
      user: {
        userId: row.user_id,
        fullName: row.full_name,
        profileImage: row.profile_image_url,
        coverImage: row.cover_image_url,
        bio: row.bio,
        education: row.education,
        city: row.city,
        primarySport: row.primary_sport,
        sportsPlayed: sportsPlayed,
        dob: row.dob,
        userType: row.user_type,
        username: row.username,
        email: row.email
      },
      followCounts: {
        followers: parseInt(row.followers_count) || 0,
        following: parseInt(row.following_count) || 0
      },
      connectionStatus: connectionStatus,
      socialHandles: row.social_handles || [],
      academicBackgrounds: row.academic_backgrounds || [],
      achievements: row.achievements || [],
      athleticPerformance: row.athletic_performance || [],
      competitionClubs: row.competition_clubs || [],
      characterLeadership: row.character_leadership || [],
      healthReadiness: row.health_readiness || [],
      videoMedia: row.video_media || []
    };
  } catch (error) {
    console.error('Error fetching complete profile:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    console.error('Error hint:', error.hint);
    console.error('Error position:', error.position);
    throw error;
  }
}

/**
 * Get user posts (separate query for better performance)
 * Can be combined with main query if needed, but keeping separate for flexibility
 * @param {string} userId - User ID
 * @param {number} limit - Limit of posts to return
 * @returns {Promise<Array>} Array of posts
 */
async function getUserPosts(userId, limit = 50) {
  const postsQuery = `
    SELECT 
      p.id,
      p.user_id,
      p.username,
      p.user_profile_url,
      p.user_type,
      p.post_type,
      p.caption,
      p.media_url,
      p.article_title,
      p.article_body,
      p.event_title,
      p.event_date,
      p.event_location,
      p.created_at,
      (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as like_count,
      (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comment_count,
      (SELECT COUNT(*) FROM post_saves WHERE post_id = p.id) as save_count
    FROM posts p
    WHERE p.user_id = $1 AND (p.is_active = true OR p.is_active IS NULL)
    ORDER BY p.created_at DESC
    LIMIT $2
  `;

  try {
    const result = await pool.query(postsQuery, [userId, limit]);
    console.log(`getUserPosts - Found ${result.rows.length} posts for user ${userId}`);
    return result.rows;
  } catch (error) {
    console.error('Error fetching user posts:', error);
    console.error('Error details:', error.message, error.stack);
    throw error;
  }
}

module.exports = {
  getUserProfile,
  upsertUserProfile,
  updateProfileImages,
  getCurrentUserProfile,
  getUserProfileWithStats,
  getUserProfileComplete,
  getUserPosts,
};

const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Get all sports
 */
async function getAllSports() {
  const query = `
    SELECT 
      id,
      name
    FROM sports
    ORDER BY name ASC
  `;
  const result = await pool.query(query);
  return result.rows;
}

/**
 * Get positions for a sport
 */
async function getPositionsBySport(sportId) {
  const query = `
    SELECT 
      sp.id,
      sp.name as position_name,
      s.name as sport_name
    FROM sport_positions sp
    INNER JOIN sports s ON sp.sport_id = s.id
    WHERE sp.sport_id = $1
    ORDER BY sp.name ASC
  `;
  const result = await pool.query(query, [sportId]);
  return result.rows;
}

/**
 * Get fields for a position (ordered by sort_order)
 */
async function getFieldsByPosition(positionId) {
  const query = `
    SELECT 
      id as field_id,
      field_key,
      field_label,
      field_type,
      unit,
      is_required,
      sort_order
    FROM position_fields
    WHERE position_id = $1
    ORDER BY sort_order ASC
  `;
  const result = await pool.query(query, [positionId]);
  return result.rows;
}

/**
 * Get sport and position names by IDs (for denormalization)
 */
async function getSportAndPositionNames(sportId, positionId) {
  const query = `
    SELECT 
      s.name as sport_name,
      sp.name as position_name
    FROM sports s
    INNER JOIN sport_positions sp ON sp.sport_id = s.id
    WHERE s.id = $1 AND sp.id = $2
  `;
  const result = await pool.query(query, [sportId, positionId]);
  return result.rows[0] || null;
}

/**
 * Get or create user sport profile
 */
async function getOrCreateUserSportProfile(userId, sportId, positionId, sportName, positionName) {
  // Check if profile already exists
  const checkQuery = `
    SELECT id
    FROM user_sport_profiles
    WHERE user_id = $1 AND sport_id = $2 AND position_id = $3
    LIMIT 1
  `;
  const checkResult = await pool.query(checkQuery, [userId, sportId, positionId]);

  if (checkResult.rows.length > 0) {
    return checkResult.rows[0].id;
  }

  // Create new profile
  const id = uuidv4();
  const insertQuery = `
    INSERT INTO user_sport_profiles (
      id,
      user_id,
      sport_id,
      sport_name,
      position_id,
      position_name,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
    RETURNING id
  `;
  const insertResult = await pool.query(insertQuery, [
    id,
    userId,
    sportId,
    sportName,
    positionId,
    positionName,
  ]);
  return insertResult.rows[0].id;
}

/**
 * Upsert user position stats
 */
async function upsertUserPositionStats(userSportProfileId, stats, fieldData) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Delete existing stats for this profile
    const deleteQuery = `
      DELETE FROM user_position_stats
      WHERE user_sport_profile_id = $1
    `;
    await client.query(deleteQuery, [userSportProfileId]);

    // Insert new stats
    if (stats && stats.length > 0) {
      const insertQuery = `
        INSERT INTO user_position_stats (
          id,
          user_sport_profile_id,
          field_id,
          field_key,
          field_label,
          unit,
          value,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      `;

      for (let i = 0; i < stats.length; i++) {
        const stat = stats[i];
        const fieldInfo = fieldData[i];
        if (fieldInfo) {
          const statId = uuidv4();
          await client.query(insertQuery, [
            statId,
            userSportProfileId,
            stat.fieldId,
            fieldInfo.field_key,
            fieldInfo.field_label,
            fieldInfo.unit || null,
            stat.value || null,
          ]);
        }
      }
    }

    await client.query('COMMIT');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get user stats for a sport profile
 */
async function getUserStatsByProfile(userSportProfileId) {
  const profileQuery = `
    SELECT 
      sport_name,
      position_name
    FROM user_sport_profiles
    WHERE id = $1
  `;
  const profileResult = await pool.query(profileQuery, [userSportProfileId]);

  if (profileResult.rows.length === 0) {
    return null;
  }

  const statsQuery = `
    SELECT 
      field_label,
      value,
      unit
    FROM user_position_stats
    WHERE user_sport_profile_id = $1
    ORDER BY field_label ASC
  `;
  const statsResult = await pool.query(statsQuery, [userSportProfileId]);

  return {
    profile: profileResult.rows[0],
    stats: statsResult.rows,
  };
}

/**
 * Get all user sport profiles with stats
 */
async function getAllUserSportProfiles(userId) {
  const profilesQuery = `
    SELECT 
      id,
      sport_id,
      sport_name,
      position_id,
      position_name,
      created_at
    FROM user_sport_profiles
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;
  const profilesResult = await pool.query(profilesQuery, [userId]);

  // Get stats for each profile
  const profilesWithStats = await Promise.all(
    profilesResult.rows.map(async (profile) => {
      const statsQuery = `
        SELECT 
          field_label,
          value,
          unit
        FROM user_position_stats
        WHERE user_sport_profile_id = $1
        ORDER BY field_label ASC
      `;
      const statsResult = await pool.query(statsQuery, [profile.id]);

      return {
        id: profile.id,
        sport_id: profile.sport_id,
        sport_name: profile.sport_name,
        position_id: profile.position_id,
        position_name: profile.position_name,
        created_at: profile.created_at,
        stats: statsResult.rows,
      };
    })
  );

  return profilesWithStats;
}

module.exports = {
  getAllSports,
  getPositionsBySport,
  getFieldsByPosition,
  getSportAndPositionNames,
  getOrCreateUserSportProfile,
  upsertUserPositionStats,
  getUserStatsByProfile,
  getAllUserSportProfiles,
};


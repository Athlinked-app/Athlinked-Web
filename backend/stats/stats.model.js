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
 * Get sport by name (case-insensitive, handles spaces)
 */
async function getSportByName(sportName) {
  const normalizedName = sportName.toLowerCase().replace(/\s+/g, '');
  const query = `
    SELECT 
      id,
      name
    FROM sports
    WHERE LOWER(REPLACE(name, ' ', '')) = $1
    LIMIT 1
  `;
  const result = await pool.query(query, [normalizedName]);
  return result.rows[0] || null;
}

/**
 * Get position by name and sport ID (case-insensitive, handles spaces)
 */
async function getPositionByName(sportId, positionName) {
  const normalizedName = positionName.toLowerCase().replace(/\s+/g, '');
  const query = `
    SELECT 
      sp.id,
      sp.name as position_name,
      s.name as sport_name
    FROM sport_positions sp
    INNER JOIN sports s ON sp.sport_id = s.id
    WHERE sp.sport_id = $1 
      AND LOWER(REPLACE(sp.name, ' ', '')) = $2
    LIMIT 1
  `;
  const result = await pool.query(query, [sportId, normalizedName]);
  return result.rows[0] || null;
}

/**
 * Create user sport profile
 * Always creates a new profile entry to allow multiple entries per sport/position combination.
 * If a unique constraint violation occurs on (user_id, sport_id), we check for existing profiles
 * and either return an existing one with the same position or handle it appropriately.
 *
 * Note: To fully support multiple entries, the database constraint should ideally be on
 * (user_id, sport_id, position_id) or removed entirely. This function works with the
 * current constraint by always attempting to create new entries.
 */
async function getOrCreateUserSportProfile(
  userId,
  sportId,
  positionId,
  sportName,
  positionName,
  fullName = null
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Always try to create a new profile entry
    // This allows multiple entries for the same sport/position (e.g., different years/seasons)
    const id = uuidv4();

    // Check if full_name column exists in the table
    // Try to insert with full_name, if it fails due to column not existing, try without it
    let insertQuery = `
      INSERT INTO user_sport_profiles (
        id,
        user_id,
        sport_id,
        sport_name,
        position_id,
        position_name,
        full_name,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id
    `;
    let insertValues = [
      id,
      userId,
      sportId,
      sportName,
      positionId,
      positionName,
      fullName,
    ];

    try {
      const insertResult = await client.query(insertQuery, insertValues);
      await client.query('COMMIT');
      return insertResult.rows[0].id;
    } catch (firstError) {
      // Rollback the failed transaction
      await client.query('ROLLBACK');

      // Handle unique constraint violation
      if (firstError.code === '23505') {
        const constraintName = firstError.constraint || '';
        const errorMessage = firstError.message || '';

        // If constraint is on (user_id, sport_id)
        if (
          constraintName.includes('user_id_sport_id') ||
          constraintName === 'user_sport_profiles_user_id_sport_id_key' ||
          constraintName.includes('user_sport_profiles') ||
          errorMessage.includes('user_sport_profiles_user_id_sport_id_key') ||
          errorMessage.includes('user_id_sport_id')
        ) {
          // Start a new transaction to check for existing profiles
          await client.query('BEGIN');

          try {
            // Get all existing profiles for this user and sport
            const checkQuery = `
              SELECT id, position_id, position_name
              FROM user_sport_profiles
              WHERE user_id = $1 AND sport_id = $2
              ORDER BY created_at DESC
            `;
            const checkResult = await client.query(checkQuery, [
              userId,
              sportId,
            ]);

            if (checkResult.rows.length > 0) {
              // Check if any existing profile has the same position
              const samePositionProfile = checkResult.rows.find(
                p => p.position_id === positionId
              );

              if (samePositionProfile) {
                // Profile with same position exists - return it to allow adding stats to it
                // This allows multiple stats entries for the same position
                await client.query('COMMIT');
                return samePositionProfile.id;
              } else {
                // Profile exists but with different position
                // Since constraint prevents multiple profiles per sport, we'll update the position
                // This allows users to change positions, but note: this will overwrite previous position data
                // Also update full_name if provided
                let updateQuery = `
                  UPDATE user_sport_profiles
                  SET position_id = $1,
                      position_name = $2
                `;
                let updateValues = [positionId, positionName];

                // Try to update full_name if column exists
                if (fullName) {
                  updateQuery = `
                    UPDATE user_sport_profiles
                    SET position_id = $1,
                        position_name = $2,
                        full_name = $3
                    WHERE user_id = $4 AND sport_id = $5
                    RETURNING id
                  `;
                  updateValues = [
                    positionId,
                    positionName,
                    fullName,
                    userId,
                    sportId,
                  ];
                } else {
                  updateQuery = `
                    UPDATE user_sport_profiles
                    SET position_id = $1,
                        position_name = $2
                    WHERE user_id = $3 AND sport_id = $4
                    RETURNING id
                  `;
                  updateValues = [positionId, positionName, userId, sportId];
                }

                try {
                  const updateResult = await client.query(
                    updateQuery,
                    updateValues
                  );
                  await client.query('COMMIT');
                  return updateResult.rows[0].id;
                } catch (updateError) {
                  // If full_name column doesn't exist, try without it
                  if (
                    updateError.code === '42703' ||
                    (updateError.message.includes('column') &&
                      updateError.message.includes('does not exist'))
                  ) {
                    updateQuery = `
                      UPDATE user_sport_profiles
                      SET position_id = $1,
                          position_name = $2
                      WHERE user_id = $3 AND sport_id = $4
                      RETURNING id
                    `;
                    updateValues = [positionId, positionName, userId, sportId];
                    const updateResult = await client.query(
                      updateQuery,
                      updateValues
                    );
                    await client.query('COMMIT');
                    return updateResult.rows[0].id;
                  }
                  throw updateError;
                }
              }
            } else {
              // No profiles found, but constraint violation occurred - this shouldn't happen
              await client.query('COMMIT');
              throw new Error('Unexpected constraint violation');
            }
          } catch (checkError) {
            await client.query('ROLLBACK');
            throw checkError;
          }
        } else {
          // Re-throw if we can't handle this constraint
          throw firstError;
        }
      } else if (
        firstError.code === '42703' ||
        (firstError.message.includes('column') &&
          firstError.message.includes('does not exist'))
      ) {
        // If column doesn't exist, try without full_name
        await client.query('BEGIN');

        insertQuery = `
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
        insertValues = [
          id,
          userId,
          sportId,
          sportName,
          positionId,
          positionName,
        ];

        try {
          const insertResult = await client.query(insertQuery, insertValues);
          await client.query('COMMIT');
          return insertResult.rows[0].id;
        } catch (insertError) {
          // Rollback the failed transaction before handling the error
          await client.query('ROLLBACK');

          // Handle unique constraint violation
          if (insertError.code === '23505') {
            const constraintName = insertError.constraint || '';
            const errorMessage = insertError.message || '';

            // If constraint is on (user_id, sport_id)
            if (
              constraintName.includes('user_id_sport_id') ||
              constraintName === 'user_sport_profiles_user_id_sport_id_key' ||
              constraintName.includes('user_sport_profiles') ||
              errorMessage.includes(
                'user_sport_profiles_user_id_sport_id_key'
              ) ||
              errorMessage.includes('user_id_sport_id')
            ) {
              // Start a new transaction to check for existing profiles
              await client.query('BEGIN');

              try {
                // Get all existing profiles for this user and sport
                const checkQuery = `
                  SELECT id, position_id, position_name
                  FROM user_sport_profiles
                  WHERE user_id = $1 AND sport_id = $2
                  ORDER BY created_at DESC
                `;
                const checkResult = await client.query(checkQuery, [
                  userId,
                  sportId,
                ]);

                if (checkResult.rows.length > 0) {
                  // Check if any existing profile has the same position
                  const samePositionProfile = checkResult.rows.find(
                    p => p.position_id === positionId
                  );

                  if (samePositionProfile) {
                    // Profile with same position exists - return it to allow adding stats to it
                    // This allows multiple stats entries for the same position
                    await client.query('COMMIT');
                    return samePositionProfile.id;
                  } else {
                    // Profile exists but with different position
                    // Since constraint prevents multiple profiles per sport, we'll update the position
                    // This allows users to change positions, but note: this will overwrite previous position data
                    // Also update full_name if provided
                    let updateQuery = `
                      UPDATE user_sport_profiles
                      SET position_id = $1,
                          position_name = $2
                    `;
                    let updateValues = [positionId, positionName];

                    // Try to update full_name if column exists
                    if (fullName) {
                      updateQuery = `
                        UPDATE user_sport_profiles
                        SET position_id = $1,
                            position_name = $2,
                            full_name = $3
                        WHERE user_id = $4 AND sport_id = $5
                        RETURNING id
                      `;
                      updateValues = [
                        positionId,
                        positionName,
                        fullName,
                        userId,
                        sportId,
                      ];
                    } else {
                      updateQuery = `
                        UPDATE user_sport_profiles
                        SET position_id = $1,
                            position_name = $2
                        WHERE user_id = $3 AND sport_id = $4
                        RETURNING id
                      `;
                      updateValues = [
                        positionId,
                        positionName,
                        userId,
                        sportId,
                      ];
                    }

                    try {
                      const updateResult = await client.query(
                        updateQuery,
                        updateValues
                      );
                      await client.query('COMMIT');
                      return updateResult.rows[0].id;
                    } catch (updateError) {
                      // If full_name column doesn't exist, try without it
                      if (
                        updateError.code === '42703' ||
                        (updateError.message.includes('column') &&
                          updateError.message.includes('does not exist'))
                      ) {
                        updateQuery = `
                          UPDATE user_sport_profiles
                          SET position_id = $1,
                              position_name = $2
                          WHERE user_id = $3 AND sport_id = $4
                          RETURNING id
                        `;
                        updateValues = [
                          positionId,
                          positionName,
                          userId,
                          sportId,
                        ];
                        const updateResult = await client.query(
                          updateQuery,
                          updateValues
                        );
                        await client.query('COMMIT');
                        return updateResult.rows[0].id;
                      }
                      throw updateError;
                    }
                  }
                } else {
                  // No profiles found, but constraint violation occurred - this shouldn't happen
                  await client.query('COMMIT');
                  throw new Error('Unexpected constraint violation');
                }
              } catch (checkError) {
                await client.query('ROLLBACK');
                throw checkError;
              }
            } else {
              // Re-throw if we can't handle this constraint
              throw insertError;
            }
          } else {
            // Re-throw other errors
            throw insertError;
          }
        }
      } else {
        // Re-throw if not a column error
        throw columnError;
      }
    }
  } catch (error) {
    // Ensure transaction is rolled back if still active
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      // Ignore rollback errors if transaction is already closed
      console.error('Error during rollback:', rollbackError);
    }
    throw error;
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error('Error releasing database connection:', releaseError);
      }
    }
  }
}

/**
 * Upsert user position stats
 * Appends new stats entries without deleting existing ones.
 * Stats are grouped by year when retrieved, allowing multiple entries per profile.
 * If a year is provided and an entry for that year exists, it updates that year's entry.
 */
async function upsertUserPositionStats(userSportProfileId, stats, fieldData) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Find the year value from stats to identify which entry this belongs to
    let yearValue = null;
    let yearFieldIndex = -1;
    for (let i = 0; i < stats.length; i++) {
      const fieldInfo = fieldData[i];
      if (
        fieldInfo &&
        (fieldInfo.field_label === 'Year' || fieldInfo.field_key === 'year')
      ) {
        yearValue = stats[i].value;
        yearFieldIndex = i;
        break;
      }
    }

    // If year is provided, delete stats for that specific year to allow updating
    // This preserves stats from other years
    if (yearValue) {
      console.log(`[upsertUserPositionStats] Deleting existing stats for year: ${yearValue}, profile: ${userSportProfileId}`);
      
      // Find all year stats for this profile and year to get their timestamps
      // Convert yearValue to string for consistent comparison
      const yearValueStr = String(yearValue).trim();
      const yearStatQuery = `
        SELECT DISTINCT created_at
        FROM user_position_stats
        WHERE user_sport_profile_id = $1
        AND field_label = 'Year'
        AND TRIM(value) = $2
        ORDER BY created_at DESC
      `;
      const yearStatResult = await client.query(yearStatQuery, [
        userSportProfileId,
        yearValueStr,
      ]);

      if (yearStatResult.rows.length > 0) {
        console.log(`[upsertUserPositionStats] Found ${yearStatResult.rows.length} year entry/entries to delete`);
        
        // Collect all timestamps that need to be deleted
        const timestampsToDelete = yearStatResult.rows.map(row => row.created_at);
        
        // For each timestamp, delete all stats created within 15 seconds
        // Using a larger window (15 seconds) to ensure we catch all related stats
        // even if there were slight delays in insertion
        for (const yearCreatedAt of timestampsToDelete) {
          const deleteYearEntryQuery = `
            DELETE FROM user_position_stats
            WHERE user_sport_profile_id = $1
            AND ABS(EXTRACT(EPOCH FROM (created_at - $2::timestamp))) <= 15
          `;
          const deleteResult = await client.query(deleteYearEntryQuery, [
            userSportProfileId,
            yearCreatedAt,
          ]);
          console.log(`[upsertUserPositionStats] Deleted ${deleteResult.rowCount} stats for timestamp: ${yearCreatedAt}`);
        }
      } else {
        console.log(`[upsertUserPositionStats] No existing year entry found for year: ${yearValue}`);
      }
    } else {
      // No year provided - just append new stats (allows multiple entries)
      // Don't delete anything
      console.log('[upsertUserPositionStats] No year provided, appending new stats without deletion');
    }

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
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
    throw error;
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error('Error releasing database connection:', releaseError);
      }
    }
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
 * Groups stats by year to allow multiple entries per profile to be displayed separately
 */
async function getAllUserSportProfiles(userId) {
  // Get profiles with full_name from users table (always available)
  // Also try to get full_name from user_sport_profiles if column exists
  const profilesQuery = `
    SELECT 
      usp.id,
      usp.sport_id,
      usp.sport_name,
      usp.position_id,
      usp.position_name,
      COALESCE(usp.full_name, u.full_name) as full_name,
      usp.created_at
    FROM user_sport_profiles usp
    LEFT JOIN users u ON usp.user_id = u.id
    WHERE usp.user_id = $1
    ORDER BY usp.created_at DESC
  `;

  let profilesResult;
  try {
    profilesResult = await pool.query(profilesQuery, [userId]);
  } catch (error) {
    // If full_name column doesn't exist in user_sport_profiles, use only users table
    if (
      error.code === '42703' ||
      (error.message.includes('column') &&
        error.message.includes('does not exist'))
    ) {
      const fallbackQuery = `
        SELECT 
          usp.id,
          usp.sport_id,
          usp.sport_name,
          usp.position_id,
          usp.position_name,
          u.full_name,
          usp.created_at
        FROM user_sport_profiles usp
        LEFT JOIN users u ON usp.user_id = u.id
        WHERE usp.user_id = $1
        ORDER BY usp.created_at DESC
      `;
      profilesResult = await pool.query(fallbackQuery, [userId]);
    } else {
      throw error;
    }
  }

  // OPTIMIZATION: Fix N+1 problem - fetch all stats in one query
  const profileIds = profilesResult.rows.map(p => p.id);
  let allStatsResult;
  
  if (profileIds.length > 0) {
    // Single query to get all stats for all profiles
    const allStatsQuery = `
      SELECT 
        user_sport_profile_id,
        field_label,
        value,
        unit,
        created_at
      FROM user_position_stats
      WHERE user_sport_profile_id = ANY($1::uuid[])
      ORDER BY user_sport_profile_id, created_at DESC, field_label ASC
    `;
    allStatsResult = await pool.query(allStatsQuery, [profileIds]);
  } else {
    allStatsResult = { rows: [] };
  }

  // Group stats by profile_id in memory
  const statsByProfile = {};
  allStatsResult.rows.forEach(stat => {
    if (!statsByProfile[stat.user_sport_profile_id]) {
      statsByProfile[stat.user_sport_profile_id] = [];
    }
    statsByProfile[stat.user_sport_profile_id].push(stat);
  });

  // Get stats for each profile and group by year
  const profilesWithStats = profilesResult.rows.map(profile => {
    const statsResult = { rows: statsByProfile[profile.id] || [] };

      // Group stats by year using created_at timestamps
      // Stats created at the same time (within 5 seconds) belong to the same entry
      const entries = [];
      const processedIndices = new Set();

      for (let i = 0; i < statsResult.rows.length; i++) {
        if (processedIndices.has(i)) continue;

        const stat = statsResult.rows[i];

        // Find the year stat for this entry (if exists)
        let yearStat = null;
        let yearStatIndex = -1;
        for (let j = 0; j < statsResult.rows.length; j++) {
          const s = statsResult.rows[j];
          if (
            s.field_label === 'Year' &&
            Math.abs(new Date(s.created_at) - new Date(stat.created_at)) <
              5000 &&
            !processedIndices.has(j)
          ) {
            yearStat = s;
            yearStatIndex = j;
            break;
          }
        }

        const entryCreatedAt = yearStat ? yearStat.created_at : stat.created_at;
        const yearValue = yearStat ? yearStat.value : null;

        // Get all stats created at the same time (within 5 seconds)
        const entryStats = [];
        for (let j = 0; j < statsResult.rows.length; j++) {
          if (processedIndices.has(j)) continue;
          const s = statsResult.rows[j];
          const timeDiff = Math.abs(
            new Date(s.created_at) - new Date(entryCreatedAt)
          );
          if (timeDiff < 5000) {
            entryStats.push(s);
            processedIndices.add(j);
          }
        }

        if (entryStats.length > 0) {
          entries.push({
            id: `${profile.id}_${yearValue || entryCreatedAt}`, // Unique ID for this entry (for frontend display)
            user_sport_profile_id: profile.id, // Original profile ID (valid UUID) for updates
            sport_id: profile.sport_id,
            sport_name: profile.sport_name,
            position_id: profile.position_id,
            position_name: profile.position_name,
            full_name: profile.full_name || null,
            created_at: entryCreatedAt,
            stats: entryStats,
          });
        }
      }

      // If no entries were created (shouldn't happen), return the profile with all stats
      if (entries.length === 0) {
        return [
          {
            id: profile.id,
            sport_id: profile.sport_id,
            sport_name: profile.sport_name,
            position_id: profile.position_id,
            position_name: profile.position_name,
            full_name: profile.full_name || null,
            created_at: profile.created_at,
            stats: statsResult.rows,
          },
        ];
      }

      return entries;
    });

  // Flatten the array (since each profile can now return multiple entries)
  return profilesWithStats.flat();
}

/**
 * Get complete stats data for a user in a single optimized query
 * Combines user data, athletic performance, profiles, stats, and sports
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} Complete stats data
 */
async function getUserStatsComplete(userId) {
  try {
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
          u.user_type
        FROM users u
        WHERE u.id = $1
      ),
      athletic_perf AS (
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
        ORDER BY ap.created_at DESC
      ),
      profiles AS (
        SELECT 
          usp.id,
          usp.sport_id,
          usp.sport_name,
          usp.position_id,
          usp.position_name,
          COALESCE(usp.full_name, u.full_name) as full_name,
          usp.created_at
        FROM user_sport_profiles usp
        LEFT JOIN users u ON usp.user_id = u.id
        WHERE usp.user_id = $1
        ORDER BY usp.created_at DESC
      ),
      all_stats AS (
        SELECT 
          ups.user_sport_profile_id,
          ups.field_label,
          ups.value,
          ups.unit,
          ups.created_at
        FROM user_position_stats ups
        WHERE ups.user_sport_profile_id IN (SELECT id FROM profiles)
        ORDER BY ups.user_sport_profile_id, ups.created_at DESC, ups.field_label ASC
      ),
      sports_list AS (
        SELECT id, name FROM sports ORDER BY name ASC
      )
      SELECT 
        jsonb_build_object(
          'user', (SELECT row_to_json(ud.*) FROM user_data ud),
          'athleticPerformance', (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', ap.id,
                'height', ap.height,
                'weight', ap.weight,
                'hand', ap.hand,
                'arm', ap.arm,
                'jerseyNumber', ap.jersey_number,
                'sport', ap.sport
              )
            )
            FROM athletic_perf ap
          ),
          'profiles', (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', p.id,
                'user_sport_profile_id', p.id,
                'sport_id', p.sport_id,
                'sport_name', p.sport_name,
                'position_id', p.position_id,
                'position_name', p.position_name,
                'full_name', p.full_name,
                'created_at', p.created_at,
                'stats', COALESCE(
                  (
                    SELECT jsonb_agg(
                      jsonb_build_object(
                        'field_label', s.field_label,
                        'value', s.value,
                        'unit', s.unit
                      )
                    )
                    FROM all_stats s
                    WHERE s.user_sport_profile_id = p.id
                  ),
                  '[]'::jsonb
                )
              )
            )
            FROM profiles p
          ),
          'sports', (
            SELECT jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name))
            FROM sports_list s
          )
        ) as result
    `;

    const result = await pool.query(completeQuery, [userId]);
    
    if (result.rows.length === 0 || !result.rows[0].result) {
      return null;
    }

    const data = result.rows[0].result;
    
    // Parse sports_played array
    let sportsPlayedArray = [];
    if (data.user.sports_played) {
      if (Array.isArray(data.user.sports_played)) {
        sportsPlayedArray = data.user.sports_played.filter(Boolean);
      } else if (typeof data.user.sports_played === 'string') {
        let sportsString = data.user.sports_played.trim();
        if (sportsString.startsWith('{') && sportsString.endsWith('}')) {
          sportsString = sportsString.slice(1, -1);
        }
        sportsString = sportsString.replace(/["']/g, '');
        sportsPlayedArray = sportsString.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    // Match user's sports with sports list
    const userSports = [];
    if (sportsPlayedArray.length > 0 && data.sports) {
      const sportsMap = new Map();
      data.sports.forEach(sport => {
        const normalizedName = sport.name.toLowerCase().replace(/\s+/g, '');
        sportsMap.set(normalizedName, sport);
      });

      sportsPlayedArray.forEach(sportName => {
        const normalizedSportName = sportName.toLowerCase().replace(/\s+/g, '');
        const matchedSport = sportsMap.get(normalizedSportName);
        if (matchedSport) {
          userSports.push(matchedSport);
        }
      });
    }

    // Group profiles by year (group stats created within 5 seconds)
    const groupedProfiles = [];
    if (data.profiles) {
      data.profiles.forEach(profile => {
        const stats = profile.stats || [];
        const entries = [];
        const processedIndices = new Set();

        for (let i = 0; i < stats.length; i++) {
          if (processedIndices.has(i)) continue;

          const stat = stats[i];
          const statCreatedAt = new Date(profile.created_at);

          // Find year stat
          let yearStat = null;
          for (let j = 0; j < stats.length; j++) {
            const s = stats[j];
            if (s.field_label === 'Year' && !processedIndices.has(j)) {
              yearStat = s;
              break;
            }
          }

          const yearValue = yearStat ? yearStat.value : null;

          // Get all stats for this entry
          const entryStats = [];
          for (let j = 0; j < stats.length; j++) {
            if (processedIndices.has(j)) continue;
            entryStats.push(stats[j]);
            processedIndices.add(j);
          }

          if (entryStats.length > 0) {
            entries.push({
              id: `${profile.id}_${yearValue || profile.created_at}`,
              user_sport_profile_id: profile.id,
              sport_id: profile.sport_id,
              sport_name: profile.sport_name,
              position_id: profile.position_id,
              position_name: profile.position_name,
              full_name: profile.full_name,
              created_at: profile.created_at,
              stats: entryStats,
            });
          }
        }

        if (entries.length > 0) {
          groupedProfiles.push(...entries);
        } else {
          groupedProfiles.push({
            id: profile.id,
            user_sport_profile_id: profile.id,
            sport_id: profile.sport_id,
            sport_name: profile.sport_name,
            position_id: profile.position_id,
            position_name: profile.position_name,
            full_name: profile.full_name,
            created_at: profile.created_at,
            stats: stats,
          });
        }
      });
    }

    return {
      user_id: data.user.user_id,
      full_name: data.user.full_name,
      profile_image_url: data.user.profile_image_url,
      cover_image_url: data.user.cover_image_url,
      bio: data.user.bio,
      education: data.user.education,
      city: data.user.city,
      primary_sport: data.user.primary_sport,
      sports_played: sportsPlayedArray.join(', '),
      sports_played_array: sportsPlayedArray,
      dob: data.user.dob,
      user_type: data.user.user_type,
      athletic_performance: data.athleticPerformance && data.athleticPerformance.length > 0
        ? data.athleticPerformance[0]
        : null,
      all_athletic_performance: data.athleticPerformance || [],
      sports: userSports.length > 0 ? userSports : (data.sports || []),
      profiles: groupedProfiles,
    };
  } catch (error) {
    console.error('Error fetching complete stats:', error);
    throw error;
  }
}

module.exports = {
  getAllSports,
  getPositionsBySport,
  getFieldsByPosition,
  getSportAndPositionNames,
  getSportByName,
  getPositionByName,
  getOrCreateUserSportProfile,
  upsertUserPositionStats,
  getUserStatsByProfile,
  getAllUserSportProfiles,
  getUserStatsComplete,
};

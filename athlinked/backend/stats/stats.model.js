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
    }
    throw error;
  } finally {
    client.release();
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
      // First, find the created_at timestamp of the year stat for this year
      const yearStatQuery = `
        SELECT created_at
        FROM user_position_stats
        WHERE user_sport_profile_id = $1
        AND field_label = 'Year'
        AND value = $2
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const yearStatResult = await client.query(yearStatQuery, [
        userSportProfileId,
        yearValue,
      ]);

      if (yearStatResult.rows.length > 0) {
        // Year entry exists - delete all stats created at the same time (within 5 seconds)
        const yearCreatedAt = yearStatResult.rows[0].created_at;
        const deleteYearEntryQuery = `
          DELETE FROM user_position_stats
          WHERE user_sport_profile_id = $1
          AND ABS(EXTRACT(EPOCH FROM (created_at - $2::timestamp))) < 5
        `;
        await client.query(deleteYearEntryQuery, [
          userSportProfileId,
          yearCreatedAt,
        ]);
      }
    } else {
      // No year provided - just append new stats (allows multiple entries)
      // Don't delete anything
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

  // Get stats for each profile and group by year
  const profilesWithStats = await Promise.all(
    profilesResult.rows.map(async profile => {
      const statsQuery = `
        SELECT 
          field_label,
          value,
          unit,
          created_at
        FROM user_position_stats
        WHERE user_sport_profile_id = $1
        ORDER BY created_at DESC, field_label ASC
      `;
      const statsResult = await pool.query(statsQuery, [profile.id]);

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
    })
  );

  // Flatten the array (since each profile can now return multiple entries)
  return profilesWithStats.flat();
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

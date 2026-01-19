const statsModel = require('./stats.model');

/**
 * Get all sports
 */
async function getAllSportsService() {
  try {
    const sports = await statsModel.getAllSports();
    return {
      success: true,
      sports: sports.map(sport => ({
        id: sport.id,
        name: sport.name,
      })),
    };
  } catch (error) {
    console.error('Get all sports service error:', error);
    throw error;
  }
}

/**
 * Get positions for a sport
 */
async function getPositionsBySportService(sportId) {
  try {
    const positions = await statsModel.getPositionsBySport(sportId);
    return {
      success: true,
      positions: positions.map(pos => ({
        id: pos.id,
        name: pos.position_name,
        sport_name: pos.sport_name,
      })),
    };
  } catch (error) {
    console.error('Get positions by sport service error:', error);
    throw error;
  }
}

/**
 * Get fields for a position
 */
async function getFieldsByPositionService(positionId) {
  try {
    const fields = await statsModel.getFieldsByPosition(positionId);
    return {
      success: true,
      fields: fields.map(field => ({
        field_id: field.field_id,
        field_key: field.field_key,
        field_label: field.field_label,
        field_type: field.field_type,
        unit: field.unit,
        is_required: field.is_required,
      })),
    };
  } catch (error) {
    console.error('Get fields by position service error:', error);
    throw error;
  }
}

/**
 * Create or update user sport profile
 */
async function createOrUpdateUserSportProfileService(
  userId,
  sportId,
  positionId
) {
  try {
    // Get sport and position names for denormalization
    const names = await statsModel.getSportAndPositionNames(
      sportId,
      positionId
    );
    if (!names) {
      throw new Error('Invalid sport or position ID');
    }

    // Get user's full name
    const pool = require('../config/db');
    const userQuery = 'SELECT full_name FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);
    const fullName = userResult.rows[0]?.full_name || null;

    // Get or create profile
    const userSportProfileId = await statsModel.getOrCreateUserSportProfile(
      userId,
      sportId,
      positionId,
      names.sport_name,
      names.position_name,
      fullName
    );

    return {
      success: true,
      user_sport_profile_id: userSportProfileId,
      message: 'User sport profile created or retrieved successfully',
    };
  } catch (error) {
    console.error('Create or update user sport profile service error:', error);
    throw error;
  }
}

/**
 * Save user position stats
 */
async function saveUserPositionStatsService(userSportProfileId, stats) {
  try {
    if (!stats || !Array.isArray(stats) || stats.length === 0) {
      throw new Error('Stats array is required and cannot be empty');
    }

    // Get field data for all field IDs (optimized batch query)
    const fieldIds = stats.map(s => s.fieldId);
    const placeholders = fieldIds.map((_, index) => `$${index + 1}`).join(', ');
    const query = `
      SELECT 
        id,
        field_key,
        field_label,
        unit
      FROM position_fields
      WHERE id IN (${placeholders})
    `;
    const pool = require('../config/db');
    const result = await pool.query(query, fieldIds);
    const fieldData = result.rows;

    // Create a map for quick lookup
    const fieldDataMap = new Map(fieldData.map(f => [f.id, f]));

    // Validate all field IDs exist
    for (const stat of stats) {
      if (!fieldDataMap.has(stat.fieldId)) {
        throw new Error(`Invalid field ID: ${stat.fieldId}`);
      }
    }

    // Use the map for efficient lookup
    const fieldDataForInsert = stats.map(stat =>
      fieldDataMap.get(stat.fieldId)
    );

    // Upsert stats
    await statsModel.upsertUserPositionStats(
      userSportProfileId,
      stats,
      fieldDataForInsert
    );

    return {
      success: true,
      message: 'User position stats saved successfully',
    };
  } catch (error) {
    console.error('Save user position stats service error:', error);
    throw error;
  }
}

/**
 * Get user stats for a sport profile
 */
async function getUserStatsByProfileService(userSportProfileId) {
  try {
    const result = await statsModel.getUserStatsByProfile(userSportProfileId);
    if (!result) {
      throw new Error('User sport profile not found');
    }

    return {
      success: true,
      sport_name: result.profile.sport_name,
      position_name: result.profile.position_name,
      fields: result.stats.map(stat => ({
        field_label: stat.field_label,
        value: stat.value,
        unit: stat.unit,
      })),
    };
  } catch (error) {
    console.error('Get user stats by profile service error:', error);
    throw error;
  }
}

/**
 * Save stats combined - handles all lookups and saves in one operation
 * This reduces API calls from 6 to 1 by doing all lookups on the backend
 * @param {string} userId - User ID
 * @param {string} sportName - Sport name (e.g., "Football", "Basketball")
 * @param {string} positionName - Position name (e.g., "Quarterback", "Point Guard")
 * @param {string} year - Year value (optional)
 * @param {object} stats - Object with field labels as keys and values (e.g., { "Passing Yards": "3500", "Touchdowns": "28" })
 * @returns {Promise<object>} Success response with updated profiles
 */
async function saveStatsCombinedService(userId, sportName, positionName, year, stats, existingUserSportProfileId = null) {
  try {
    if (!userId || !sportName || !positionName) {
      throw new Error('userId, sportName, and positionName are required');
    }

    if (!stats || typeof stats !== 'object' || Object.keys(stats).length === 0) {
      throw new Error('stats object is required and cannot be empty');
    }

    let userSportProfileId;
    let positionId;

    // If editing (existing profile ID provided), use it directly
    if (existingUserSportProfileId) {
      console.log(`[saveStatsCombinedService] Using existing profile ID: ${existingUserSportProfileId}`);
      
      // Verify the profile exists and belongs to the user, and get position_id
      const pool = require('../config/db');
      const verifyQuery = 'SELECT id, position_id FROM user_sport_profiles WHERE id = $1 AND user_id = $2';
      const verifyResult = await pool.query(verifyQuery, [existingUserSportProfileId, userId]);
      
      if (verifyResult.rows.length === 0) {
        throw new Error('Invalid profile ID or profile does not belong to user');
      }
      
      userSportProfileId = existingUserSportProfileId;
      positionId = verifyResult.rows[0].position_id;
    } else {
      // Step 1: Lookup sport by name
      const sport = await statsModel.getSportByName(sportName);
      if (!sport) {
        throw new Error(`Sport "${sportName}" not found`);
      }

      // Step 2: Lookup position by name and sport ID
      const position = await statsModel.getPositionByName(sport.id, positionName);
      if (!position) {
        throw new Error(`Position "${positionName}" not found for sport "${sportName}"`);
      }

      positionId = position.id;

      // Step 3: Get or create user-sport-profile
      const pool = require('../config/db');
      const userQuery = 'SELECT full_name FROM users WHERE id = $1';
      const userResult = await pool.query(userQuery, [userId]);
      const fullName = userResult.rows[0]?.full_name || null;

      userSportProfileId = await statsModel.getOrCreateUserSportProfile(
        userId,
        sport.id,
        position.id,
        sport.name,
        position.position_name,
        fullName
      );
    }

    // Get fields for position
    const fields = await statsModel.getFieldsByPosition(positionId);
    if (!fields || fields.length === 0) {
      throw new Error(`No fields found for position "${positionName}"`);
    }

    // Step 5: Map stats object to field IDs
    // Create a map for efficient lookup (case-insensitive, handles spaces)
    const fieldMap = new Map();
    fields.forEach(field => {
      const normalizedLabel = field.field_label.toLowerCase().replace(/\s+/g, '');
      fieldMap.set(normalizedLabel, field);
      // Also map by field_key
      if (field.field_key) {
        const normalizedKey = field.field_key.toLowerCase().replace(/\s+/g, '');
        fieldMap.set(normalizedKey, field);
      }
    });

    // Convert stats object to array of { fieldId, value }
    const statsArray = [];
    
    // First, add Year field if provided
    const yearField = fields.find(f => 
      f.field_label.toLowerCase() === 'year' || 
      f.field_key === 'year'
    );
    if (yearField && year) {
      statsArray.push({
        fieldId: yearField.field_id,
        value: String(year)
      });
    }

    // Then add all other stats
    for (const [label, value] of Object.entries(stats)) {
      // Skip year if it's in stats object (we already added it)
      if (label.toLowerCase() === 'year' && year) {
        continue;
      }

      const normalizedLabel = label.toLowerCase().replace(/\s+/g, '');
      const field = fieldMap.get(normalizedLabel);
      
      if (field) {
        statsArray.push({
          fieldId: field.field_id,
          value: String(value)
        });
      } else {
        console.warn(`Field "${label}" not found for position "${positionName}". Skipping.`);
      }
    }

    if (statsArray.length === 0) {
      throw new Error('No valid stats to save. Please check field names.');
    }

    // Step 6: Prepare field data for upsert
    const fieldDataForInsert = statsArray.map(stat => {
      const field = fields.find(f => f.field_id === stat.fieldId);
      return field || null;
    }).filter(Boolean);

    // Step 7: Save stats
    await statsModel.upsertUserPositionStats(
      userSportProfileId,
      statsArray,
      fieldDataForInsert
    );

    // Step 8: Get updated profiles list
    const updatedProfiles = await statsModel.getAllUserSportProfiles(userId);

    return {
      success: true,
      message: 'Stats saved successfully',
      userSportProfileId: userSportProfileId,
      updatedProfiles: updatedProfiles
    };
  } catch (error) {
    console.error('Save stats combined service error:', error);
    throw error;
  }
}

/**
 * Get all user sport profiles with stats
 */
async function getAllUserSportProfilesService(userId) {
  try {
    const profiles = await statsModel.getAllUserSportProfiles(userId);
    return {
      success: true,
      profiles: profiles.map(profile => ({
        id: profile.id,
        user_sport_profile_id: profile.user_sport_profile_id || profile.id, // Include original profile ID
        sport_id: profile.sport_id,
        sport_name: profile.sport_name,
        position_id: profile.position_id,
        position_name: profile.position_name,
        full_name: profile.full_name || null,
        created_at: profile.created_at,
        stats: profile.stats.map(stat => ({
          field_label: stat.field_label,
          value: stat.value,
          unit: stat.unit,
        })),
      })),
    };
  } catch (error) {
    console.error('Get all user sport profiles service error:', error);
    throw error;
  }
}

module.exports = {
  getAllSportsService,
  getPositionsBySportService,
  getFieldsByPositionService,
  createOrUpdateUserSportProfileService,
  saveUserPositionStatsService,
  getUserStatsByProfileService,
  getAllUserSportProfilesService,
  saveStatsCombinedService,
};

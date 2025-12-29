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
async function createOrUpdateUserSportProfileService(userId, sportId, positionId) {
  try {
    // Get sport and position names for denormalization
    const names = await statsModel.getSportAndPositionNames(sportId, positionId);
    if (!names) {
      throw new Error('Invalid sport or position ID');
    }

    // Get or create profile
    const userSportProfileId = await statsModel.getOrCreateUserSportProfile(
      userId,
      sportId,
      positionId,
      names.sport_name,
      names.position_name
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
    const fieldDataForInsert = stats.map(stat => fieldDataMap.get(stat.fieldId));

    // Upsert stats
    await statsModel.upsertUserPositionStats(userSportProfileId, stats, fieldDataForInsert);

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
 * Get all user sport profiles with stats
 */
async function getAllUserSportProfilesService(userId) {
  try {
    const profiles = await statsModel.getAllUserSportProfiles(userId);
    return {
      success: true,
      profiles: profiles.map(profile => ({
        id: profile.id,
        sport_id: profile.sport_id,
        sport_name: profile.sport_name,
        position_id: profile.position_id,
        position_name: profile.position_name,
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
};


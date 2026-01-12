const pool = require('../config/db');

/**
 * Search and filter users based on criteria
 * @param {object} filters - Search filters object
 * @returns {Promise<Array>} Array of filtered users
 */
async function searchUsers(filters) {
  try {
    let query = `
      SELECT 
        id,
        full_name,
        username,
        email,
        user_type,
        profile_url,
        bio,
        city,
        education,
        primary_sport,
        sports_played,
        dob,
        created_at,
        updated_at
      FROM users
      WHERE 1=1
    `;

    const queryParams = [];
    let paramIndex = 1;

    // Filter by search query (name or username)
    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      query += ` AND (LOWER(full_name) LIKE $${paramIndex} OR LOWER(username) LIKE $${paramIndex})`;
      queryParams.push(`%${filters.searchQuery.toLowerCase()}%`);
      paramIndex++;
    }

    // Filter by user type (athlete, coach, organization)
    if (filters.searchType && filters.searchType.trim() !== '') {
      query += ` AND LOWER(user_type) = $${paramIndex}`;
      queryParams.push(filters.searchType.toLowerCase());
      paramIndex++;
    }

    // Filter by college/school (education field)
    if (filters.collegeSchool && filters.collegeSchool.trim() !== '') {
      query += ` AND LOWER(education) LIKE $${paramIndex}`;
      queryParams.push(`%${filters.collegeSchool.toLowerCase()}%`);
      paramIndex++;
    }

    // Filter by location (city field)
    if (filters.location && filters.location.trim() !== '') {
      query += ` AND LOWER(city) LIKE $${paramIndex}`;
      queryParams.push(`%${filters.location.toLowerCase()}%`);
      paramIndex++;
    }

    // Filter by sport specialization (primary_sport or sports_played)
    if (
      filters.sportSpecialization &&
      filters.sportSpecialization.trim() !== ''
    ) {
      query += ` AND (LOWER(primary_sport) = $${paramIndex} OR LOWER(sports_played)::text LIKE $${paramIndex + 1})`;
      queryParams.push(filters.sportSpecialization.toLowerCase());
      queryParams.push(`%${filters.sportSpecialization.toLowerCase()}%`);
      paramIndex += 2;
    }

    // Apply sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'name':
          query += ` ORDER BY full_name ASC`;
          break;
        case 'latest':
          query += ` ORDER BY created_at DESC`;
          break;
        case 'oldest':
          query += ` ORDER BY created_at ASC`;
          break;
        case 'youngest':
          // Sort by youngest age (most recent DOB = lowest age, nulls last)
          query += ` ORDER BY dob DESC NULLS LAST`;
          break;
        default:
          query += ` ORDER BY created_at DESC`;
      }
    } else {
      query += ` ORDER BY created_at DESC`;
    }

    // Add limit for performance
    query += ` LIMIT 100`;

    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
}

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<object>} User object
 */
async function getUserById(userId) {
  try {
    const query = `
      SELECT 
        id,
        full_name,
        username,
        email,
        user_type,
        profile_url,
        bio,
        city,
        education,
        primary_sport,
        sports_played,
        dob,
        created_at
      FROM users
      WHERE id = $1
    `;

    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}

/**
 * Get all users with optional limit, sorting, user type and college/school filtering
 * @param {number} limit - Optional limit for results
 * @param {string} sortBy - Optional sort parameter
 * @param {string} searchType - Optional user type filter (athlete, coach, organization)
 * @param {string} collegeSchool - Optional college/school filter
 * @returns {Promise<Array>} Array of users
 */
async function getAllUsers(
  limit = 100,
  sortBy = '',
  searchType = '',
  collegeSchool = ''
) {
  try {
    let query = `
      SELECT DISTINCT
        u.id,
        u.full_name,
        u.username,
        u.email,
        u.user_type,
        u.profile_url,
        u.bio,
        u.city,
        u.education,
        u.primary_sport,
        u.sports_played,
        u.dob,
        u.created_at
      FROM users u
    `;

    const queryParams = [];
    let paramIndex = 1;

    // Join with academic_backgrounds if college/school filter is provided
    if (collegeSchool && collegeSchool.trim() !== '') {
      query += `
        INNER JOIN academic_backgrounds ab ON u.id = ab.user_id
      `;
    }

    query += ` WHERE 1=1`;

    // Filter by user type if provided
    if (searchType && searchType.trim() !== '') {
      query += ` AND LOWER(u.user_type) = $${paramIndex}`;
      queryParams.push(searchType.toLowerCase());
      paramIndex++;
    }

    // Filter by college/school if provided
    if (collegeSchool && collegeSchool.trim() !== '') {
      query += ` AND LOWER(ab.school) LIKE $${paramIndex}`;
      queryParams.push(`%${collegeSchool.toLowerCase()}%`);
      paramIndex++;
    }

    // Apply sorting
    switch (sortBy) {
      case 'name':
        query += ` ORDER BY u.full_name ASC`;
        break;
      case 'latest':
        query += ` ORDER BY u.created_at DESC`;
        break;
      case 'oldest':
        query += ` ORDER BY u.created_at ASC`;
        break;
      case 'youngest':
        query += ` ORDER BY u.dob DESC NULLS LAST`;
        break;
      default:
        query += ` ORDER BY u.created_at DESC`;
    }

    query += ` LIMIT $${paramIndex}`;
    queryParams.push(limit);

    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}

module.exports = {
  searchUsers,
  getUserById,
  getAllUsers,
};

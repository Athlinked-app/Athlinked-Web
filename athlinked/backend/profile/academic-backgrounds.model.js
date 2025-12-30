const pool = require('../config/db');

/**
 * Get all academic backgrounds for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of academic backgrounds
 */
async function getAcademicBackgroundsByUserId(userId) {
  const query = `
    SELECT 
      id,
      user_id,
      school,
      degree,
      qualification,
      start_date,
      end_date,
      degree_pdf,
      academic_gpa,
      sat_act_score,
      academic_honors,
      college_eligibility_status,
      graduation_year,
      primary_state_region,
      preferred_college_regions,
      willingness_to_relocate,
      gender,
      created_at,
      updated_at
    FROM academic_backgrounds
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;

  try {
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching academic backgrounds:', error);
    throw error;
  }
}

/**
 * Create a new academic background
 * @param {string} userId - User ID
 * @param {object} data - Academic background data
 * @returns {Promise<object>} Created academic background
 */
async function createAcademicBackground(userId, data) {
  const query = `
    INSERT INTO academic_backgrounds (
      user_id,
      school,
      degree,
      qualification,
      start_date,
      end_date,
      degree_pdf,
      academic_gpa,
      sat_act_score,
      academic_honors,
      college_eligibility_status,
      graduation_year,
      primary_state_region,
      preferred_college_regions,
      willingness_to_relocate,
      gender
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *
  `;

  const values = [
    userId,
    data.school || null,
    data.degree || null,
    data.qualification || null,
    data.startDate || null,
    data.endDate || null,
    data.degreePdf || null,
    data.academicGpa || null,
    data.satActScore || null,
    data.academicHonors || null,
    data.collegeEligibilityStatus || null,
    data.graduationYear || null,
    data.primaryStateRegion || null,
    data.preferredCollegeRegions || null,
    data.willingnessToRelocate || null,
    data.gender || null,
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating academic background:', error);
    throw error;
  }
}

/**
 * Update an academic background
 * @param {string} id - Academic background ID
 * @param {object} data - Academic background data
 * @returns {Promise<object>} Updated academic background
 */
async function updateAcademicBackground(id, data) {
  const updateFields = [];
  const values = [];
  let paramIndex = 1;

  if (data.school !== undefined) {
    updateFields.push(`school = $${paramIndex++}`);
    values.push(data.school || null);
  }
  if (data.degree !== undefined) {
    updateFields.push(`degree = $${paramIndex++}`);
    values.push(data.degree || null);
  }
  if (data.qualification !== undefined) {
    updateFields.push(`qualification = $${paramIndex++}`);
    values.push(data.qualification || null);
  }
  if (data.startDate !== undefined) {
    updateFields.push(`start_date = $${paramIndex++}`);
    values.push(data.startDate || null);
  }
  if (data.endDate !== undefined) {
    updateFields.push(`end_date = $${paramIndex++}`);
    values.push(data.endDate || null);
  }
  if (data.degreePdf !== undefined) {
    updateFields.push(`degree_pdf = $${paramIndex++}`);
    values.push(data.degreePdf || null);
  }
  if (data.academicGpa !== undefined) {
    updateFields.push(`academic_gpa = $${paramIndex++}`);
    values.push(data.academicGpa || null);
  }
  if (data.satActScore !== undefined) {
    updateFields.push(`sat_act_score = $${paramIndex++}`);
    values.push(data.satActScore || null);
  }
  if (data.academicHonors !== undefined) {
    updateFields.push(`academic_honors = $${paramIndex++}`);
    values.push(data.academicHonors || null);
  }
  if (data.collegeEligibilityStatus !== undefined) {
    updateFields.push(`college_eligibility_status = $${paramIndex++}`);
    values.push(data.collegeEligibilityStatus || null);
  }
  if (data.graduationYear !== undefined) {
    updateFields.push(`graduation_year = $${paramIndex++}`);
    values.push(data.graduationYear || null);
  }
  if (data.primaryStateRegion !== undefined) {
    updateFields.push(`primary_state_region = $${paramIndex++}`);
    values.push(data.primaryStateRegion || null);
  }
  if (data.preferredCollegeRegions !== undefined) {
    updateFields.push(`preferred_college_regions = $${paramIndex++}`);
    values.push(data.preferredCollegeRegions || null);
  }
  if (data.willingnessToRelocate !== undefined) {
    updateFields.push(`willingness_to_relocate = $${paramIndex++}`);
    values.push(data.willingnessToRelocate || null);
  }
  if (data.gender !== undefined) {
    updateFields.push(`gender = $${paramIndex++}`);
    values.push(data.gender || null);
  }

  if (updateFields.length === 0) {
    throw new Error('No fields to update');
  }

  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const query = `
    UPDATE academic_backgrounds
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Academic background not found');
    }
    return result.rows[0];
  } catch (error) {
    console.error('Error updating academic background:', error);
    throw error;
  }
}

/**
 * Delete an academic background
 * @param {string} id - Academic background ID
 * @returns {Promise<boolean>} True if deleted successfully
 */
async function deleteAcademicBackground(id) {
  const query = `
    DELETE FROM academic_backgrounds
    WHERE id = $1
    RETURNING id
  `;

  try {
    const result = await pool.query(query, [id]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error deleting academic background:', error);
    throw error;
  }
}

module.exports = {
  getAcademicBackgroundsByUserId,
  createAcademicBackground,
  updateAcademicBackground,
  deleteAcademicBackground,
};


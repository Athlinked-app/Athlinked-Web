const pool = require('../db/pool');

class GoogleAuthService {
  /**
   * Find user by Google ID
   */
  async findUserByGoogleId(googleId) {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE google_id = $1',
        [googleId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by Google ID:', error);
      throw error;
    }
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email) {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Create new user from Google OAuth
   */
  async createGoogleUser(googleId, email, fullName, profilePicture, emailVerified) {
    try {
      const result = await pool.query(
        `INSERT INTO users (
          google_id, 
          email, 
          full_name, 
          profile_picture,
          email_verified,
          password
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, google_id, email, full_name, profile_picture, user_type, created_at`,
        [googleId, email, fullName, profilePicture, emailVerified, null]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating Google user:', error);
      throw error;
    }
  }

  /**
   * Link Google account to existing user
   */
  async linkGoogleAccount(userId, googleId, profilePicture) {
    try {
      const result = await pool.query(
        `UPDATE users 
         SET google_id = $1, 
             profile_picture = COALESCE(profile_picture, $2),
             email_verified = TRUE,
             updated_at = NOW()
         WHERE id = $3
         RETURNING id, google_id, email, full_name, profile_picture, user_type, created_at`,
        [googleId, profilePicture, userId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error linking Google account:', error);
      throw error;
    }
  }

  /**
   * Update user type for Google user
   */
  async updateUserType(googleId, userType) {
    try {
      const result = await pool.query(
        `UPDATE users 
         SET user_type = $1, 
             updated_at = NOW()
         WHERE google_id = $2
         RETURNING id, google_id, email, full_name, profile_picture, user_type, created_at`,
        [userType, googleId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error updating user type:', error);
      throw error;
    }
  }

  /**
   * Update user profile with additional information
   */
  async updateUserProfile(googleId, profileData) {
    try {
      const setClauses = [];
      const values = [];
      let paramIndex = 1;

      // Add dynamic fields based on what's provided
      if (profileData.sports_played !== undefined) {
        setClauses.push(`sports_played = $${paramIndex++}`);
        values.push(profileData.sports_played);
      }
      if (profileData.primary_sport !== undefined) {
        setClauses.push(`primary_sport = $${paramIndex++}`);
        values.push(profileData.primary_sport);
      }
      if (profileData.company_name !== undefined) {
        setClauses.push(`company_name = $${paramIndex++}`);
        values.push(profileData.company_name);
      }
      if (profileData.designation !== undefined) {
        setClauses.push(`designation = $${paramIndex++}`);
        values.push(profileData.designation);
      }

      // Always update the updated_at timestamp
      setClauses.push(`updated_at = NOW()`);
      
      // Add google_id as the last parameter
      values.push(googleId);

      const query = `
        UPDATE users 
        SET ${setClauses.join(', ')}
        WHERE google_id = $${paramIndex}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    try {
      const result = await pool.query(
        `SELECT * FROM users WHERE id = $1`,
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }
}

module.exports = new GoogleAuthService();
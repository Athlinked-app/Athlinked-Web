const jwt = require('jsonwebtoken');
const googleAuthService = require('./google-auth.service');

class GoogleAuthController {
  async googleSignIn(req, res) {
    console.log('=== NEW GOOGLE SIGN IN CALLED ===');
    
    try {
      const { google_id, email, full_name, profile_picture, email_verified } = req.body;

      if (!google_id || !email) {
        return res.status(400).json({
          success: false,
          message: 'Google ID and email are required',
        });
      }

      let user = await googleAuthService.findUserByGoogleId(google_id);

      if (user) {
        if (!user.user_type) {
          return res.json({
            success: true,
            needs_user_type: true,
            google_id: user.google_id,
            email: user.email,
            full_name: user.full_name,
            profile_picture: user.profile_picture,
          });
        }

        const accessToken = jwt.sign(
          { userId: user.id, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );

        return res.json({
          success: true,
          needs_user_type: false,
          token: accessToken,
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            user_type: user.user_type,
            profile_picture: user.profile_picture,
            google_id: user.google_id,
          },
        });
      }

      const existingUser = await googleAuthService.findUserByEmail(email);

      if (existingUser) {
        user = await googleAuthService.linkGoogleAccount(
          existingUser.id,
          google_id,
          profile_picture
        );

        if (!user.user_type) {
          return res.json({
            success: true,
            needs_user_type: true,
            google_id: user.google_id,
            email: user.email,
            full_name: user.full_name,
            profile_picture: user.profile_picture,
          });
        }

        const accessToken = jwt.sign(
          { userId: user.id, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );

        return res.json({
          success: true,
          needs_user_type: false,
          token: accessToken,
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            user_type: user.user_type,
            profile_picture: user.profile_picture,
            google_id: user.google_id,
          },
        });
      }

      user = await googleAuthService.createGoogleUser(
        google_id,
        email,
        full_name,
        profile_picture,
        email_verified
      );

      return res.json({
        success: true,
        needs_user_type: true,
        google_id: user.google_id,
        email: user.email,
        full_name: user.full_name,
        profile_picture: user.profile_picture,
      });
    } catch (error) {
      console.error('Google sign-in error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to process Google sign-in',
        error: error.message,
      });
    }
  }

  async completeGoogleSignup(req, res) {
    console.log('=== COMPLETE GOOGLE SIGNUP (User Type) CALLED ===');
    console.log('Request body:', req.body);
    
    try {
      const { google_id, user_type } = req.body;

      if (!google_id || !user_type) {
        return res.status(400).json({
          success: false,
          message: 'Google ID and user type are required',
        });
      }

      const validUserTypes = ['athlete', 'coach', 'organization'];
      if (!validUserTypes.includes(user_type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user type. Must be athlete, coach, or organization',
        });
      }

      const user = await googleAuthService.updateUserType(google_id, user_type);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // DON'T generate token yet - user still needs to complete profile
      return res.json({
        success: true,
        needs_profile_completion: true,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          user_type: user.user_type,
          profile_picture: user.profile_picture,
          google_id: user.google_id,
        },
      });
    } catch (error) {
      console.error('Complete Google signup error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to complete Google signup',
        error: error.message,
      });
    }
  }

  async completeGoogleProfile(req, res) {
    console.log('=== COMPLETE GOOGLE PROFILE CALLED ===');
    console.log('Request body:', req.body);
    
    try {
      const {
        google_id,
        sports_played,
        primary_sport,
        company_name,
        designation,
      } = req.body;

      if (!google_id) {
        return res.status(400).json({
          success: false,
          message: 'Google ID is required',
        });
      }

      const user = await googleAuthService.findUserByGoogleId(google_id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Update user profile based on user_type
      let updateData = {};
      
      if (user.user_type === 'coach') {
        updateData = { 
          sports_played: sports_played || null, 
          primary_sport: primary_sport || null 
        };
      } else if (user.user_type === 'organization') {
        updateData = { 
          company_name: company_name || null, 
          designation: designation || null 
        };
      }

      // Update the user profile
      const updatedUser = await googleAuthService.updateUserProfile(
        google_id,
        updateData
      );

      // NOW generate the token after profile is complete
      const accessToken = jwt.sign(
        { userId: updatedUser.id, email: updatedUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      return res.json({
        success: true,
        token: accessToken,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          full_name: updatedUser.full_name,
          user_type: updatedUser.user_type,
          profile_picture: updatedUser.profile_picture,
          google_id: updatedUser.google_id,
          sports_played: updatedUser.sports_played,
          primary_sport: updatedUser.primary_sport,
          company_name: updatedUser.company_name,
          designation: updatedUser.designation,
        },
      });
    } catch (error) {
      console.error('Complete Google profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to complete profile',
        error: error.message,
      });
    }
  }
}

module.exports = new GoogleAuthController();
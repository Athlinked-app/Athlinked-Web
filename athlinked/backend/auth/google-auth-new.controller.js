const jwt = require('jsonwebtoken');
const googleAuthService = require('./google-auth.service');
const refreshTokensService = require('./refresh-tokens.service');

class GoogleAuthController {
  async googleSignIn(req, res) {
    console.log('=== NEW GOOGLE SIGN IN CALLED ===');

    try {
      const { google_id, email, full_name, profile_picture, email_verified } =
        req.body;

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

        // Generate token pair
        const { accessToken, refreshToken } =
          await refreshTokensService.createTokenPair(
            {
              id: user.id,
              email: user.email,
              username: user.username,
              user_type: user.user_type,
            },
            req.headers['user-agent'],
            req.ip
          );

        return res.json({
          success: true,
          needs_user_type: false,
          token: accessToken, // For backward compatibility
          accessToken,
          refreshToken,
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

        // Generate token pair
        const { accessToken, refreshToken } =
          await refreshTokensService.createTokenPair(
            {
              id: user.id,
              email: user.email,
              username: user.username,
              user_type: user.user_type,
            },
            req.headers['user-agent'],
            req.ip
          );

        return res.json({
          success: true,
          needs_user_type: false,
          token: accessToken, // For backward compatibility
          accessToken,
          refreshToken,
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
        dob,
        sports_played,
        primary_sport,
        company_name,
        designation,
        parent_name,
        parent_email,
        parent_dob,
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
      let updateData = {
        dob: dob || null, // Always store DOB for all user types
      };

      if (user.user_type === 'coach') {
        updateData = {
          ...updateData,
          sports_played: sports_played || null,
          primary_sport: primary_sport || null,
        };
      } else if (user.user_type === 'athlete') {
        updateData = {
          ...updateData,
          sports_played: sports_played || null,
          primary_sport: primary_sport || null,
          parent_name: parent_name || null,
          parent_email: parent_email || null,
          parent_dob: parent_dob || null,
        };
      } else if (user.user_type === 'organization') {
        updateData = {
          ...updateData,
          company_name: company_name || null,
          designation: designation || null,
        };
      }

      // Update the user profile
      const updatedUser = await googleAuthService.updateUserProfile(
        google_id,
        updateData
      );

      // Send parent signup link for athletes
      if (updatedUser.user_type === 'athlete' && updatedUser.parent_email) {
        try {
          const { sendParentSignupLink } = require('../utils/email');
          const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          const signupLink = updatedUser.email
            ? `${baseUrl}/parent-signup?email=${encodeURIComponent(updatedUser.email)}`
            : `${baseUrl}/parent-signup?username=${encodeURIComponent(updatedUser.username || '')}`;

          console.log(
            `📧 Sending parent signup link to: ${updatedUser.parent_email}`
          );
          await sendParentSignupLink(
            updatedUser.parent_email,
            updatedUser.username || updatedUser.email || updatedUser.full_name,
            signupLink
          );
          console.log('✅ Parent signup link sent successfully');
        } catch (emailError) {
          console.error('❌ Error sending parent signup link:', emailError);
          // Don't fail the signup if email fails
        }
      }

      // Generate access token and refresh token using the refresh tokens service
      const { accessToken, refreshToken } =
        await refreshTokensService.createTokenPair(
          {
            id: updatedUser.id,
            email: updatedUser.email,
            username: updatedUser.username,
            user_type: updatedUser.user_type,
          },
          req.headers['user-agent'],
          req.ip
        );

      return res.json({
        success: true,
        token: accessToken, // For backward compatibility
        accessToken,
        refreshToken,
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

  /**
   * Send OTP to athlete's email and parent signup link to parent's email
   */
  async sendAthleteEmails(req, res) {
    console.log('=== SEND ATHLETE EMAILS CALLED ===');
    console.log('Request body:', req.body);

    try {
      const {
        athlete_email,
        athlete_name,
        parent_email,
        parent_name,
        google_id,
      } = req.body;

      if (!athlete_email || !parent_email || !google_id) {
        return res.status(400).json({
          success: false,
          message: 'Athlete email, parent email, and Google ID are required',
        });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Import email functions
      const { sendOTPEmail, sendParentSignupLink } = require('../utils/email');

      // Store OTP in memory with expiration (10 minutes)
      if (!global.googleAthleteOTPs) {
        global.googleAthleteOTPs = new Map();
      }

      const otpData = {
        otp,
        google_id,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      };
      global.googleAthleteOTPs.set(google_id, otpData);

      // Send OTP to athlete's email
      await sendOTPEmail(athlete_email.toLowerCase().trim(), otp);

      // Send parent signup link to parent's email
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const signupLink = `${baseUrl}/parent-signup?email=${encodeURIComponent(athlete_email.toLowerCase())}`;

      await sendParentSignupLink(
        parent_email.toLowerCase().trim(),
        athlete_name || 'your child',
        signupLink
      );

      return res.json({
        success: true,
        message: 'Verification emails sent successfully',
      });
    } catch (error) {
      console.error('Send athlete emails error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification emails',
        error: error.message,
      });
    }
  }

  /**
   * Verify OTP for Google athlete
   */
  async verifyAthleteOtp(req, res) {
    console.log('=== VERIFY ATHLETE OTP CALLED ===');
    console.log('Request body:', req.body);

    try {
      const { google_id, otp } = req.body;

      if (!google_id || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Google ID and OTP are required',
        });
      }

      if (!global.googleAthleteOTPs) {
        return res.status(400).json({
          success: false,
          message: 'OTP not found or expired',
        });
      }

      // Get stored OTP data
      const storedData = global.googleAthleteOTPs.get(google_id);

      if (!storedData) {
        return res.status(400).json({
          success: false,
          message: 'OTP not found or expired',
        });
      }

      // Check if OTP expired
      if (Date.now() > storedData.expiresAt) {
        global.googleAthleteOTPs.delete(google_id);
        return res.status(400).json({
          success: false,
          message: 'OTP has expired',
        });
      }

      // Verify OTP
      if (storedData.otp !== otp.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP',
        });
      }

      // OTP is valid, remove it
      global.googleAthleteOTPs.delete(google_id);

      return res.json({
        success: true,
        message: 'OTP verified successfully',
      });
    } catch (error) {
      console.error('Verify athlete OTP error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify OTP',
        error: error.message,
      });
    }
  }
}

module.exports = new GoogleAuthController();

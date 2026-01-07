const jwt = require('jsonwebtoken');
const googleAuthService = require('./google-auth.service');
const refreshTokensService = require('./refresh-tokens.service');

class GoogleAuthController {
  /**
   * Handle Google OAuth sign-in
   * POST /api/auth/google
   */
  async googleSignIn(req, res) {
    try {
      const { google_id, email, full_name, profile_picture, email_verified } = req.body;

      // Validate required fields
      if (!google_id || !email) {
        return res.status(400).json({
          success: false,
          message: 'Google ID and email are required',
        });
      }

      // Check if user exists by Google ID
      let user = await googleAuthService.findUserByGoogleId(google_id);

      if (user) {
        // Existing Google user - check if they have a user_type
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

        // User exists and has user_type - generate tokens and log them in
        const accessToken = jwt.sign(
          { userId: user.id, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
          { userId: user.id },
          process.env.REFRESH_TOKEN_SECRET,
          { expiresIn: '7d' }
        );

        // Store refresh token
        await refreshTokensService.createRefreshToken(user.id, refreshToken);

        return res.json({
          success: true,
          needs_user_type: false,
          token: accessToken,
          refreshToken: refreshToken,
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

      // Check if user exists with this email (non-Google account)
      const existingUser = await googleAuthService.findUserByEmail(email);

      if (existingUser) {
        // Link Google account to existing user
        user = await googleAuthService.linkGoogleAccount(
          existingUser.id,
          google_id,
          profile_picture
        );

        // Check if they have user_type
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

        // Generate tokens
        const accessToken = jwt.sign(
          { userId: user.id, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
          { userId: user.id },
          process.env.REFRESH_TOKEN_SECRET,
          { expiresIn: '7d' }
        );

        await refreshTokensService.createRefreshToken(user.id, refreshToken);

        return res.json({
          success: true,
          needs_user_type: false,
          token: accessToken,
          refreshToken: refreshToken,
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

      // New user - create account
      user = await googleAuthService.createGoogleUser(
        google_id,
        email,
        full_name,
        profile_picture,
        email_verified
      );

      // New user needs to select user_type
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

  /**
   * Complete Google OAuth signup by setting user_type
   * POST /api/auth/google/complete
   */
  async completeGoogleSignup(req, res) {
    try {
      const { google_id, user_type } = req.body;

      // Validate required fields
      if (!google_id || !user_type) {
        return res.status(400).json({
          success: false,
          message: 'Google ID and user type are required',
        });
      }

      // Validate user_type
      const validUserTypes = ['athlete', 'coach', 'organization'];
      if (!validUserTypes.includes(user_type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user type. Must be athlete, coach, or organization',
        });
      }

      // Update user with selected user_type
      const user = await googleAuthService.updateUserType(google_id, user_type);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Generate tokens
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
      );

      // Store refresh token
      await refreshTokensService.createRefreshToken(user.id, refreshToken);

      return res.json({
        success: true,
        token: accessToken,
        refreshToken: refreshToken,
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
}

module.exports = new GoogleAuthController();
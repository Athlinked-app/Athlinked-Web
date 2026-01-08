const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const refreshTokensController = require('./refresh-tokens.controller');
const googleAuthController = require('./google-auth-new.controller');

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Google OAuth sign-in
 *     description: Sign in or sign up using Google OAuth
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - google_id
 *               - email
 *             properties:
 *               google_id:
 *                 type: string
 *                 example: "1234567890"
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               full_name:
 *                 type: string
 *                 example: "John Doe"
 *               profile_picture:
 *                 type: string
 *                 example: "https://..."
 *               email_verified:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Google sign-in successful
 */
router.post('/google', googleAuthController.googleSignIn);

/**
 * @swagger
 * /api/auth/google/complete:
 *   post:
 *     summary: Complete Google OAuth signup - Set user type
 *     description: Set user type after Google sign-in
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - google_id
 *               - user_type
 *             properties:
 *               google_id:
 *                 type: string
 *                 example: "1234567890"
 *               user_type:
 *                 type: string
 *                 enum: [athlete, coach, organization]
 *                 example: "athlete"
 *     responses:
 *       200:
 *         description: User type set successfully
 */
router.post('/google/complete', googleAuthController.completeGoogleSignup);

/**
 * @swagger
 * /api/auth/google/complete-profile:
 *   post:
 *     summary: Complete Google OAuth profile
 *     description: Add additional profile information after user type selection
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - google_id
 *             properties:
 *               google_id:
 *                 type: string
 *                 example: "1234567890"
 *               sports_played:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Basketball", "Football"]
 *               primary_sport:
 *                 type: string
 *                 example: "Basketball"
 *               company_name:
 *                 type: string
 *                 example: "Sports Academy Inc"
 *               designation:
 *                 type: string
 *                 example: "Director"
 *     responses:
 *       200:
 *         description: Profile completed successfully, returns JWT token
 */
router.post(
  '/google/complete-profile',
  googleAuthController.completeGoogleProfile
);

/**
 * @swagger
 * /api/auth/google/send-athlete-emails:
 *   post:
 *     summary: Send OTP to athlete and parent signup link
 *     description: Sends verification OTP to athlete's email and signup link to parent's email
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - athlete_email
 *               - parent_email
 *               - google_id
 *             properties:
 *               athlete_email:
 *                 type: string
 *                 example: "athlete@example.com"
 *               athlete_name:
 *                 type: string
 *                 example: "John Doe"
 *               parent_email:
 *                 type: string
 *                 example: "parent@example.com"
 *               parent_name:
 *                 type: string
 *                 example: "Jane Doe"
 *               google_id:
 *                 type: string
 *                 example: "1234567890"
 *     responses:
 *       200:
 *         description: Verification emails sent successfully
 */
router.post(
  '/google/send-athlete-emails',
  googleAuthController.sendAthleteEmails
);

/**
 * @swagger
 * /api/auth/google/verify-athlete-otp:
 *   post:
 *     summary: Verify OTP for Google athlete signup
 *     description: Verifies the OTP sent to athlete's email during Google signup
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - google_id
 *               - otp
 *             properties:
 *               google_id:
 *                 type: string
 *                 example: "1234567890"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 */
router.post(
  '/google/verify-athlete-otp',
  googleAuthController.verifyAthleteOtp
);

router.post('/refresh', refreshTokensController.refreshToken);
router.post('/logout', refreshTokensController.logout);
router.post(
  '/logout-all',
  authenticateToken,
  refreshTokensController.logoutAll
);

module.exports = router;

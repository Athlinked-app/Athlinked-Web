const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const signupController = require('./signup.controller');

/**
 * @swagger
 * /api/signup/start:
 *   post:
 *     summary: Start signup process
 *     description: Validate data, generate OTP, and send email
 *     tags: [Signup]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/start', signupController.startSignup);

/**
 * @swagger
 * /api/signup/verify-otp:
 *   post:
 *     summary: Verify OTP and create user account
 *     description: Verify OTP code and complete user registration
 *     tags: [Signup]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified and account created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *       400:
 *         description: Invalid OTP or bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/verify-otp', signupController.verifyOtp);

/**
 * @swagger
 * /api/signup/user/{email}:
 *   get:
 *     summary: Get user data by email
 *     description: Retrieve user information by email address
 *     tags: [Signup]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: User email address
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/user/:email', signupController.getUserByEmail);

/**
 * @swagger
 * /api/signup/user-by-username/{username}:
 *   get:
 *     summary: Get user data by username
 *     description: Retrieve user information by username
 *     tags: [Signup]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/user-by-username/:username', signupController.getUserByUsername);

/**
 * @swagger
 * /api/signup/parent-complete:
 *   post:
 *     summary: Complete parent signup
 *     description: Complete parent signup by setting password
 *     tags: [Signup]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecurePassword123!"
 *     responses:
 *       200:
 *         description: Parent signup completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/parent-complete', signupController.parentComplete);

/**
 * @swagger
 * /api/signup/users:
 *   get:
 *     summary: Get all users
 *     description: Get all users for "People you may know" feature
 *     tags: [Signup]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: excludeUserId
 *         schema:
 *           type: string
 *         description: User ID to exclude from results
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of users to return
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/users', signupController.getAllUsers);

/**
 * @swagger
 * /api/signup/my-children:
 *   get:
 *     summary: Get my children
 *     description: Get all children profiles for the authenticated parent
 *     tags: [Signup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Children retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 children:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "user-id-123"
 *                       full_name:
 *                         type: string
 *                         example: "John Doe"
 *                       username:
 *                         type: string
 *                         example: "johndoe"
 *                       email:
 *                         type: string
 *                         example: "john@example.com"
 *                       profile_url:
 *                         type: string
 *                         nullable: true
 *                         example: "/uploads/profile/image.jpg"
 *                       cover_url:
 *                         type: string
 *                         nullable: true
 *                       primary_sport:
 *                         type: string
 *                         example: "football"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Only parents can access this endpoint
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/my-children',
  authenticateToken,
  signupController.getMyChildren
);

module.exports = router;

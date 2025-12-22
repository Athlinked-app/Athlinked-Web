const express = require('express');
const router = express.Router();
const signupController = require('./signup.controller');

/**
 * POST /api/signup/start
 * Start signup process: validate data, generate OTP, send email
 */
router.post('/start', signupController.startSignup);

/**
 * POST /api/signup/verify-otp
 * Verify OTP and create user account
 */
router.post('/verify-otp', signupController.verifyOtp);

/**
 * GET /api/signup/user/:email
 * Get user data by email
 */
router.get('/user/:email', signupController.getUserByEmail);

module.exports = router;

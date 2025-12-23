const express = require('express');
const router = express.Router();
const forgotPasswordController = require('./forgot-password.controller');

/**
 * POST /api/forgot-password/request
 * Request OTP for password reset
 */
router.post('/request', forgotPasswordController.requestOTP);

/**
 * POST /api/forgot-password/verify-otp
 * Verify OTP for password reset
 */
router.post('/verify-otp', forgotPasswordController.verifyOTP);

/**
 * POST /api/forgot-password/reset
 * Reset password after OTP verification
 */
router.post('/reset', forgotPasswordController.resetPassword);

module.exports = router;

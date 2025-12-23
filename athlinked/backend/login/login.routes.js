const express = require('express');
const router = express.Router();
const loginController = require('./login.controller');

/**
 * POST /api/login
 * Authenticate user with email and password
 */
router.post('/', loginController.login);

module.exports = router;

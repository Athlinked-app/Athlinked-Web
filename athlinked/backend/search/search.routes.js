const express = require('express');
const router = express.Router();
const searchController = require('./search.controller');

/**
 * GET /api/search
 * Search and filter users with query parameters
 * Query params: searchQuery, sortBy, searchType, collegeSchool, location, sportSpecialization, gender, teamLevel, teamCaptain
 */
router.get('/', searchController.searchUsers);

/**
 * GET /api/search/users
 * Get all users with optional limit
 * Query params: limit (default: 100)
 */
router.get('/users', searchController.getAllUsers);

/**
 * GET /api/search/user/:userId
 * Get user by ID
 */
router.get('/user/:userId', searchController.getUserById);

module.exports = router;

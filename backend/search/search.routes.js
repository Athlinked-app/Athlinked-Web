const express = require('express');
const router = express.Router();
const searchController = require('./search.controller');

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Search and filter users
 *     description: Search for users with multiple filter options including sort, user type, location, sport, etc.
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: searchQuery
 *         schema:
 *           type: string
 *         description: Search by name or username
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, latest, oldest]
 *         description: Sort results by name (A-Z), latest users, or oldest users
 *       - in: query
 *         name: searchType
 *         schema:
 *           type: string
 *           enum: [athlete, coach, organization]
 *         description: Filter by user type
 *       - in: query
 *         name: collegeSchool
 *         schema:
 *           type: string
 *         description: Filter by college or school name
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by city/location
 *       - in: query
 *         name: sportSpecialization
 *         schema:
 *           type: string
 *         description: Filter by sport
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [male, female, other]
 *         description: Filter by gender
 *       - in: query
 *         name: teamLevel
 *         schema:
 *           type: string
 *           enum: [professional, college, high-school, youth]
 *         description: Filter by team level
 *       - in: query
 *         name: teamCaptain
 *         schema:
 *           type: string
 *           enum: [yes, no]
 *         description: Filter by team captain status
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
 *                 count:
 *                   type: integer
 *                   example: 25
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', searchController.searchUsers);

/**
 * @swagger
 * /api/search/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve all users with optional limit
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
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
 *                 count:
 *                   type: integer
 *                   example: 100
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/users', searchController.getAllUsers);

/**
 * @swagger
 * /api/search/user/{userId}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a specific user by their ID
 *     tags: [Search]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
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
 *       400:
 *         description: Bad request - User ID required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/user/:userId', searchController.getUserById);

module.exports = router;

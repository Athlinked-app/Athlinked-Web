const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const profileController = require('./profile.controller');
const socialHandlesController = require('./social-handles.controller');
const academicBackgroundsController = require('./academic-backgrounds.controller');
const achievementsController = require('./achievements.controller');
const athleticPerformanceController = require('./athletic-performance.controller');
const competitionClubsController = require('./competition-clubs.controller');
const characterLeadershipController = require('./character-leadership.controller');
const healthReadinessController = require('./health-readiness.controller');
const videoMediaController = require('./video-media.controller');
const uploadPdf = require('./upload-pdf');

/**
 * POST /api/profile/upload
 * Upload profile or cover image
 * NOTE: Must be before other routes to avoid conflicts
 */
// This route is handled by profile-upload.routes.js

/**
 * @swagger
 * /api/profile/images:
 *   post:
 *     summary: Update profile images
 *     description: Update profile picture or cover image
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: string
 *                 example: "/uploads/profile/image.jpg"
 *               coverImage:
 *                 type: string
 *                 example: "/uploads/profile/cover.jpg"
 *     responses:
 *       200:
 *         description: Profile images updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/images',
  authenticateToken,
  profileController.updateProfileImages
);

/**
 * @swagger
 * /api/profile:
 *   post:
 *     summary: Create or update user profile
 *     description: Create a new profile or update existing profile (UPSERT)
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               bio:
 *                 type: string
 *                 example: "Athlete bio"
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "2000-01-01"
 *     responses:
 *       200:
 *         description: Profile created or updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 profile:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', authenticateToken, profileController.upsertUserProfile);

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile information
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
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
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authenticateToken, profileController.getCurrentUserProfile);

/**
 * Social Handles Routes
 * These must be before /:userId route to avoid matching conflicts
 */

/**
 * @swagger
 * /api/profile/{userId}/social-handles:
 *   get:
 *     summary: Get social handles
 *     description: Get all social handles for a user
 *     tags: [Profile]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Social handles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 socialHandles:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get(
  '/:userId/social-handles',
  socialHandlesController.getSocialHandlesController
);

/**
 * @swagger
 * /api/profile/{userId}/social-handles:
 *   post:
 *     summary: Create social handle
 *     description: Create a new social handle for a user
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - platform
 *               - handle
 *             properties:
 *               platform:
 *                 type: string
 *                 example: "Instagram"
 *               handle:
 *                 type: string
 *                 example: "@username"
 *     responses:
 *       201:
 *         description: Social handle created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 socialHandle:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/:userId/social-handles',
  authenticateToken,
  socialHandlesController.createSocialHandleController
);

/**
 * @swagger
 * /api/profile/social-handles/{id}:
 *   put:
 *     summary: Update social handle
 *     description: Update an existing social handle
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Social handle ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               platform:
 *                 type: string
 *                 example: "Instagram"
 *               handle:
 *                 type: string
 *                 example: "@newusername"
 *     responses:
 *       200:
 *         description: Social handle updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/social-handles/:id',
  authenticateToken,
  socialHandlesController.updateSocialHandleController
);

/**
 * @swagger
 * /api/profile/social-handles/{id}:
 *   delete:
 *     summary: Delete social handle
 *     description: Delete a social handle
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Social handle ID
 *     responses:
 *       200:
 *         description: Social handle deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/social-handles/:id',
  authenticateToken,
  socialHandlesController.deleteSocialHandleController
);

/**
 * Academic Backgrounds Routes
 */

/**
 * @swagger
 * /api/profile/{userId}/academic-backgrounds:
 *   get:
 *     summary: Get academic backgrounds
 *     description: Get all academic backgrounds for a user
 *     tags: [Profile]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Academic backgrounds retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 academicBackgrounds:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get(
  '/:userId/academic-backgrounds',
  academicBackgroundsController.getAcademicBackgroundsController
);

/**
 * @swagger
 * /api/profile/{userId}/academic-backgrounds:
 *   post:
 *     summary: Create academic background
 *     description: Create a new academic background entry
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               school:
 *                 type: string
 *                 example: "High School Name"
 *               degree:
 *                 type: string
 *                 example: "High School Diploma"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2018-09-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2022-06-01"
 *     responses:
 *       201:
 *         description: Academic background created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 academicBackground:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/:userId/academic-backgrounds',
  authenticateToken,
  (req, res, next) => {
    uploadPdf.single('degreePdf')(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload error',
        });
      }
      next();
    });
  },
  academicBackgroundsController.createAcademicBackgroundController
);

/**
 * @swagger
 * /api/profile/academic-backgrounds/{id}:
 *   put:
 *     summary: Update academic background
 *     description: Update an existing academic background
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Academic background ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               school:
 *                 type: string
 *               degree:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Academic background updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/academic-backgrounds/:id',
  authenticateToken,
  (req, res, next) => {
    uploadPdf.single('degreePdf')(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload error',
        });
      }
      next();
    });
  },
  academicBackgroundsController.updateAcademicBackgroundController
);

/**
 * @swagger
 * /api/profile/academic-backgrounds/{id}:
 *   delete:
 *     summary: Delete academic background
 *     description: Delete an academic background entry
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Academic background ID
 *     responses:
 *       200:
 *         description: Academic background deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/academic-backgrounds/:id',
  authenticateToken,
  academicBackgroundsController.deleteAcademicBackgroundController
);

/**
 * Achievements Routes
 */

/**
 * @swagger
 * /api/profile/{userId}/achievements:
 *   get:
 *     summary: Get achievements
 *     description: Get all achievements for a user
 *     tags: [Profile]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Achievements retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 achievements:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get(
  '/:userId/achievements',
  achievementsController.getAchievementsController
);

/**
 * @swagger
 * /api/profile/{userId}/achievements:
 *   post:
 *     summary: Create achievement
 *     description: Create a new achievement entry
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "State Championship"
 *               description:
 *                 type: string
 *                 example: "Won state championship in 2022"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2022-06-15"
 *     responses:
 *       201:
 *         description: Achievement created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 achievement:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/:userId/achievements',
  authenticateToken,
  (req, res, next) => {
    console.log('POST /achievements - Content-Type:', req.headers['content-type']);
    console.log('POST /achievements - Body keys:', Object.keys(req.body || {}));
    uploadPdf.single('mediaPdf')(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload error',
        });
      }
      console.log('After multer - req.file:', req.file ? req.file.filename : 'no file');
      next();
    });
  },
  achievementsController.createAchievementController
);

/**
 * @swagger
 * /api/profile/achievements/{id}:
 *   put:
 *     summary: Update achievement
 *     description: Update an existing achievement
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Achievement ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Achievement updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/achievements/:id',
  authenticateToken,
  (req, res, next) => {
    console.log('PUT /achievements - Content-Type:', req.headers['content-type']);
    console.log('PUT /achievements - Body keys:', Object.keys(req.body || {}));
    uploadPdf.single('mediaPdf')(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload error',
        });
      }
      console.log('After multer - req.file:', req.file ? req.file.filename : 'no file');
      next();
    });
  },
  achievementsController.updateAchievementController
);

/**
 * @swagger
 * /api/profile/achievements/{id}:
 *   delete:
 *     summary: Delete achievement
 *     description: Delete an achievement entry
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Achievement ID
 *     responses:
 *       200:
 *         description: Achievement deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/achievements/:id',
  authenticateToken,
  achievementsController.deleteAchievementController
);

/**
 * Athletic Performance Routes
 */

/**
 * @swagger
 * /api/profile/{userId}/athletic-performance:
 *   get:
 *     summary: Get athletic performance data
 *     description: Get all athletic performance data for a user
 *     tags: [Profile]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Athletic performance data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 athleticPerformance:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get(
  '/:userId/athletic-performance',
  athleticPerformanceController.getAthleticPerformanceController
);

/**
 * @swagger
 * /api/profile/{userId}/athletic-performance:
 *   post:
 *     summary: Create athletic performance entry
 *     description: Create a new athletic performance entry
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               metric:
 *                 type: string
 *                 example: "40 Yard Dash"
 *               value:
 *                 type: string
 *                 example: "4.5 seconds"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2023-01-15"
 *     responses:
 *       201:
 *         description: Athletic performance entry created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 athleticPerformance:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/:userId/athletic-performance',
  authenticateToken,
  athleticPerformanceController.createAthleticPerformanceController
);

/**
 * @swagger
 * /api/profile/athletic-performance/{id}:
 *   put:
 *     summary: Update athletic performance entry
 *     description: Update an existing athletic performance entry
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Athletic performance ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               metric:
 *                 type: string
 *               value:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Athletic performance entry updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/athletic-performance/:id',
  authenticateToken,
  athleticPerformanceController.updateAthleticPerformanceController
);

/**
 * @swagger
 * /api/profile/athletic-performance/{id}:
 *   delete:
 *     summary: Delete athletic performance entry
 *     description: Delete an athletic performance entry
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Athletic performance ID
 *     responses:
 *       200:
 *         description: Athletic performance entry deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/athletic-performance/:id',
  authenticateToken,
  athleticPerformanceController.deleteAthleticPerformanceController
);

/**
 * Competition Clubs Routes
 */

/**
 * @swagger
 * /api/profile/{userId}/competition-clubs:
 *   get:
 *     summary: Get competition clubs
 *     description: Get all competition clubs for a user
 *     tags: [Profile]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Competition clubs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 competitionClubs:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get(
  '/:userId/competition-clubs',
  competitionClubsController.getCompetitionClubsController
);

/**
 * @swagger
 * /api/profile/{userId}/competition-clubs:
 *   post:
 *     summary: Create competition club entry
 *     description: Create a new competition club entry
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clubName:
 *                 type: string
 *                 example: "Elite Sports Club"
 *               position:
 *                 type: string
 *                 example: "Forward"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2020-01-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2023-12-31"
 *     responses:
 *       201:
 *         description: Competition club entry created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 competitionClub:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/:userId/competition-clubs',
  authenticateToken,
  competitionClubsController.createCompetitionClubController
);

/**
 * @swagger
 * /api/profile/competition-clubs/{id}:
 *   put:
 *     summary: Update competition club entry
 *     description: Update an existing competition club entry
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Competition club ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clubName:
 *                 type: string
 *               position:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Competition club entry updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/competition-clubs/:id',
  authenticateToken,
  competitionClubsController.updateCompetitionClubController
);

/**
 * @swagger
 * /api/profile/competition-clubs/{id}:
 *   delete:
 *     summary: Delete competition club entry
 *     description: Delete a competition club entry
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Competition club ID
 *     responses:
 *       200:
 *         description: Competition club entry deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/competition-clubs/:id',
  authenticateToken,
  competitionClubsController.deleteCompetitionClubController
);

/**
 * Character and Leadership Routes
 */

/**
 * @swagger
 * /api/profile/{userId}/character-leadership:
 *   get:
 *     summary: Get character and leadership data
 *     description: Get all character and leadership data for a user
 *     tags: [Profile]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Character and leadership data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 characterLeadership:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get(
  '/:userId/character-leadership',
  characterLeadershipController.getCharacterLeadershipController
);

/**
 * @swagger
 * /api/profile/{userId}/character-leadership:
 *   post:
 *     summary: Create character and leadership entry
 *     description: Create a new character and leadership entry
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Team Captain"
 *               description:
 *                 type: string
 *                 example: "Led team to championship"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2023-06-01"
 *     responses:
 *       201:
 *         description: Character and leadership entry created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 characterLeadership:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/:userId/character-leadership',
  authenticateToken,
  characterLeadershipController.createCharacterLeadershipController
);

/**
 * @swagger
 * /api/profile/character-leadership/{id}:
 *   put:
 *     summary: Update character and leadership entry
 *     description: Update an existing character and leadership entry
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Character and leadership ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Character and leadership entry updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/character-leadership/:id',
  authenticateToken,
  characterLeadershipController.updateCharacterLeadershipController
);

/**
 * @swagger
 * /api/profile/character-leadership/{id}:
 *   delete:
 *     summary: Delete character and leadership entry
 *     description: Delete a character and leadership entry
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Character and leadership ID
 *     responses:
 *       200:
 *         description: Character and leadership entry deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/character-leadership/:id',
  authenticateToken,
  characterLeadershipController.deleteCharacterLeadershipController
);

/**
 * Health and Readiness Routes
 */

/**
 * @swagger
 * /api/profile/{userId}/health-readiness:
 *   get:
 *     summary: Get health and readiness data
 *     description: Get all health and readiness data for a user
 *     tags: [Profile]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Health and readiness data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 healthReadiness:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get(
  '/:userId/health-readiness',
  healthReadinessController.getHealthReadinessController
);

/**
 * @swagger
 * /api/profile/{userId}/health-readiness:
 *   post:
 *     summary: Create health and readiness entry
 *     description: Create a new health and readiness entry
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               condition:
 *                 type: string
 *                 example: "Fully healthy"
 *               notes:
 *                 type: string
 *                 example: "No injuries, ready to compete"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *     responses:
 *       201:
 *         description: Health and readiness entry created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 healthReadiness:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/:userId/health-readiness',
  authenticateToken,
  healthReadinessController.createHealthReadinessController
);

/**
 * @swagger
 * /api/profile/health-readiness/{id}:
 *   put:
 *     summary: Update health and readiness entry
 *     description: Update an existing health and readiness entry
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Health and readiness ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               condition:
 *                 type: string
 *               notes:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Health and readiness entry updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/health-readiness/:id',
  authenticateToken,
  healthReadinessController.updateHealthReadinessController
);

/**
 * @swagger
 * /api/profile/health-readiness/{id}:
 *   delete:
 *     summary: Delete health and readiness entry
 *     description: Delete a health and readiness entry
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Health and readiness ID
 *     responses:
 *       200:
 *         description: Health and readiness entry deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/health-readiness/:id',
  authenticateToken,
  healthReadinessController.deleteHealthReadinessController
);

/**
 * Video and Media Routes
 */

/**
 * @swagger
 * /api/profile/{userId}/video-media:
 *   get:
 *     summary: Get video and media data
 *     description: Get all video and media data for a user
 *     tags: [Profile]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Video and media data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 videoMedia:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get(
  '/:userId/video-media',
  videoMediaController.getVideoMediaController
);

/**
 * @swagger
 * /api/profile/{userId}/video-media:
 *   post:
 *     summary: Create video and media entry
 *     description: Create a new video and media entry
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Highlight Reel"
 *               url:
 *                 type: string
 *                 example: "https://example.com/video.mp4"
 *               description:
 *                 type: string
 *                 example: "Game highlights from 2023 season"
 *     responses:
 *       201:
 *         description: Video and media entry created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 videoMedia:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/:userId/video-media',
  authenticateToken,
  videoMediaController.createVideoMediaController
);

/**
 * @swagger
 * /api/profile/video-media/{id}:
 *   put:
 *     summary: Update video and media entry
 *     description: Update an existing video and media entry
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Video and media ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               url:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Video and media entry updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/video-media/:id',
  authenticateToken,
  videoMediaController.updateVideoMediaController
);

/**
 * @swagger
 * /api/profile/video-media/{id}:
 *   delete:
 *     summary: Delete video and media entry
 *     description: Delete a video and media entry
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Video and media ID
 *     responses:
 *       200:
 *         description: Video and media entry deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/video-media/:id',
  authenticateToken,
  videoMediaController.deleteVideoMediaController
);

/**
 * @swagger
 * /api/profile/{userId}:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve a user's profile information
 *     tags: [Profile]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 profile:
 *                   type: object
 *       404:
 *         description: Profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:userId', profileController.getUserProfile);

module.exports = router;

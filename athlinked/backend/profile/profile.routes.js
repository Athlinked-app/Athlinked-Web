const express = require('express');
const router = express.Router();
const profileController = require('./profile.controller');
const socialHandlesController = require('./social-handles.controller');
const academicBackgroundsController = require('./academic-backgrounds.controller');
const achievementsController = require('./achievements.controller');
const athleticPerformanceController = require('./athletic-performance.controller');
const competitionClubsController = require('./competition-clubs.controller');
const characterLeadershipController = require('./character-leadership.controller');
const healthReadinessController = require('./health-readiness.controller');
const videoMediaController = require('./video-media.controller');

/**
 * POST /api/profile/upload
 * Upload profile or cover image
 * NOTE: Must be before other routes to avoid conflicts
 */
// This route is handled by profile-upload.routes.js

/**
 * POST /api/profile/images
 * Update profile images only
 * Auth required
 * NOTE: Must be before /:userId route to avoid matching "images" as userId
 */
router.post('/images', profileController.updateProfileImages);

/**
 * POST /api/profile
 * Create or update user profile (UPSERT)
 * Auth required
 */
router.post('/', profileController.upsertUserProfile);

/**
 * Social Handles Routes
 * These must be before /:userId route to avoid matching conflicts
 */

/**
 * GET /api/profile/:userId/social-handles
 * Get all social handles for a user
 */
router.get('/:userId/social-handles', socialHandlesController.getSocialHandlesController);

/**
 * POST /api/profile/:userId/social-handles
 * Create a new social handle
 */
router.post('/:userId/social-handles', socialHandlesController.createSocialHandleController);

/**
 * PUT /api/profile/social-handles/:id
 * Update a social handle
 */
router.put('/social-handles/:id', socialHandlesController.updateSocialHandleController);

/**
 * DELETE /api/profile/social-handles/:id
 * Delete a social handle
 */
router.delete('/social-handles/:id', socialHandlesController.deleteSocialHandleController);

/**
 * Academic Backgrounds Routes
 */

/**
 * GET /api/profile/:userId/academic-backgrounds
 * Get all academic backgrounds for a user
 */
router.get('/:userId/academic-backgrounds', academicBackgroundsController.getAcademicBackgroundsController);

/**
 * POST /api/profile/:userId/academic-backgrounds
 * Create a new academic background
 */
router.post('/:userId/academic-backgrounds', academicBackgroundsController.createAcademicBackgroundController);

/**
 * PUT /api/profile/academic-backgrounds/:id
 * Update an academic background
 */
router.put('/academic-backgrounds/:id', academicBackgroundsController.updateAcademicBackgroundController);

/**
 * DELETE /api/profile/academic-backgrounds/:id
 * Delete an academic background
 */
router.delete('/academic-backgrounds/:id', academicBackgroundsController.deleteAcademicBackgroundController);

/**
 * Achievements Routes
 */

/**
 * GET /api/profile/:userId/achievements
 * Get all achievements for a user
 */
router.get('/:userId/achievements', achievementsController.getAchievementsController);

/**
 * POST /api/profile/:userId/achievements
 * Create a new achievement
 */
router.post('/:userId/achievements', achievementsController.createAchievementController);

/**
 * PUT /api/profile/achievements/:id
 * Update an achievement
 */
router.put('/achievements/:id', achievementsController.updateAchievementController);

/**
 * DELETE /api/profile/achievements/:id
 * Delete an achievement
 */
router.delete('/achievements/:id', achievementsController.deleteAchievementController);

/**
 * Athletic Performance Routes
 */

/**
 * GET /api/profile/:userId/athletic-performance
 * Get all athletic performance data for a user
 */
router.get('/:userId/athletic-performance', athleticPerformanceController.getAthleticPerformanceController);

/**
 * POST /api/profile/:userId/athletic-performance
 * Create a new athletic performance entry
 */
router.post('/:userId/athletic-performance', athleticPerformanceController.createAthleticPerformanceController);

/**
 * PUT /api/profile/athletic-performance/:id
 * Update an athletic performance entry
 */
router.put('/athletic-performance/:id', athleticPerformanceController.updateAthleticPerformanceController);

/**
 * DELETE /api/profile/athletic-performance/:id
 * Delete an athletic performance entry
 */
router.delete('/athletic-performance/:id', athleticPerformanceController.deleteAthleticPerformanceController);

/**
 * Competition Clubs Routes
 */

/**
 * GET /api/profile/:userId/competition-clubs
 * Get all competition clubs for a user
 */
router.get('/:userId/competition-clubs', competitionClubsController.getCompetitionClubsController);

/**
 * POST /api/profile/:userId/competition-clubs
 * Create a new competition club entry
 */
router.post('/:userId/competition-clubs', competitionClubsController.createCompetitionClubController);

/**
 * PUT /api/profile/competition-clubs/:id
 * Update a competition club entry
 */
router.put('/competition-clubs/:id', competitionClubsController.updateCompetitionClubController);

/**
 * DELETE /api/profile/competition-clubs/:id
 * Delete a competition club entry
 */
router.delete('/competition-clubs/:id', competitionClubsController.deleteCompetitionClubController);

/**
 * Character and Leadership Routes
 */

/**
 * GET /api/profile/:userId/character-leadership
 * Get all character and leadership data for a user
 */
router.get('/:userId/character-leadership', characterLeadershipController.getCharacterLeadershipController);

/**
 * POST /api/profile/:userId/character-leadership
 * Create a new character and leadership entry
 */
router.post('/:userId/character-leadership', characterLeadershipController.createCharacterLeadershipController);

/**
 * PUT /api/profile/character-leadership/:id
 * Update a character and leadership entry
 */
router.put('/character-leadership/:id', characterLeadershipController.updateCharacterLeadershipController);

/**
 * DELETE /api/profile/character-leadership/:id
 * Delete a character and leadership entry
 */
router.delete('/character-leadership/:id', characterLeadershipController.deleteCharacterLeadershipController);

/**
 * Health and Readiness Routes
 */

/**
 * GET /api/profile/:userId/health-readiness
 * Get all health and readiness data for a user
 */
router.get('/:userId/health-readiness', healthReadinessController.getHealthReadinessController);

/**
 * POST /api/profile/:userId/health-readiness
 * Create a new health and readiness entry
 */
router.post('/:userId/health-readiness', healthReadinessController.createHealthReadinessController);

/**
 * PUT /api/profile/health-readiness/:id
 * Update a health and readiness entry
 */
router.put('/health-readiness/:id', healthReadinessController.updateHealthReadinessController);

/**
 * DELETE /api/profile/health-readiness/:id
 * Delete a health and readiness entry
 */
router.delete('/health-readiness/:id', healthReadinessController.deleteHealthReadinessController);

/**
 * Video and Media Routes
 */

/**
 * GET /api/profile/:userId/video-media
 * Get all video and media data for a user
 */
router.get('/:userId/video-media', videoMediaController.getVideoMediaController);

/**
 * POST /api/profile/:userId/video-media
 * Create a new video and media entry
 */
router.post('/:userId/video-media', videoMediaController.createVideoMediaController);

/**
 * PUT /api/profile/video-media/:id
 * Update a video and media entry
 */
router.put('/video-media/:id', videoMediaController.updateVideoMediaController);

/**
 * DELETE /api/profile/video-media/:id
 * Delete a video and media entry
 */
router.delete('/video-media/:id', videoMediaController.deleteVideoMediaController);

/**
 * GET /api/profile/:userId
 * Get user profile
 * NOTE: This must be last to avoid matching other /:userId routes
 */
router.get('/:userId', profileController.getUserProfile);

module.exports = router;

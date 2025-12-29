const express = require('express');
const router = express.Router();
const statsController = require('./stats.controller');

// 1. Get All Sports
router.get('/sports', statsController.getAllSports);

// 2. Get Positions for a Sport
router.get('/sports/:sportId/positions', statsController.getPositionsBySport);

// 3. Get Fields for a Position
router.get('/positions/:positionId/fields', statsController.getFieldsByPosition);

// 4. Create / Update User Sport Profile
router.post('/user/sport-profile', statsController.createOrUpdateUserSportProfile);

// 5. Save User Position Stats
router.post('/user/position-stats', statsController.saveUserPositionStats);

// 6. Get User Stats for a Sport
router.get('/user/sport-profile/:id/stats', statsController.getUserStatsByProfile);

// 7. Get All User Sport Profiles with Stats
router.get('/user/sport-profiles', statsController.getAllUserSportProfiles);

module.exports = router;


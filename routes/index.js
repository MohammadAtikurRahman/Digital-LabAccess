const express = require("express");
const router = express.Router();

// Controllers are already refactored to use NeDB
const timeDataController = require('../controllers/timeDataController');
const schoolController = require('../controllers/schoolController');
const videoController = require('../controllers/videoDataController');

// Routes for Time Data
router.get('/', timeDataController.getIndex);
router.get('/get-all', timeDataController.getAllSessions);
router.get('/get-alltime', timeDataController.getAlltime);

// Routes for School Data
router.post('/post-school', schoolController.postSchool);
router.get('/get-school', schoolController.getSchool);

// Routes for Video Data
router.post('/post-video', videoController.postVideo);
router.get('/get-video', videoController.getVideo);

module.exports = router;

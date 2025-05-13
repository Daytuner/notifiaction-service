// src/api/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController.js');



// Create demo user
router.post('/demo', userController.createDemoUser);
// Get user notifications
router.get('/:id/notifications', userController.getUserNotifications);



module.exports = router;
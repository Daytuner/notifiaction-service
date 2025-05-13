// src/api/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController.js');
const { validateNotification } = require('../validators/notificationValidator.js');
// const authMiddleware = require('../middleware/auth.js');

// Apply auth middleware to all routes
// router.use(authMiddleware);

// Send a notification
router.post('/', validateNotification, notificationController.sendNotification);

// Get notification by ID
router.get('/:id', notificationController.getNotificationById);

// Update notification status (e.g., mark as read)
router.patch('/:id/status', notificationController.updateNotificationStatus);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
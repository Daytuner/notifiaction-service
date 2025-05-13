// src/services/inAppService.js
const User = require('../models/user.js');
const Notification = require('../models/notification.js');
const logger = require('../utils/logger.js');

/**
 * Send in-app notification
 * @param {Object} notification - Notification object
 */
exports.sendInApp = async (notification) => {
  try {
    const { userId } = notification;
    
    // Get user
    const user = await User.findOne({ userId });
    
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }
    
    // Check user preferences
    if (user.notificationPreferences?.inApp?.enabled === false) {
      logger.info(`In-app notifications disabled for user ${userId}`);
      return { skipped: true, reason: 'User has disabled in-app notifications' };
    }
    
    // For in-app notifications, we just update the status
    // No actual sending is required as they're stored in the database
    // and retrieved when the user requests their notifications
    
    await Notification.findByIdAndUpdate(notification._id, {
      status: 'DELIVERED',
    });
    
    logger.info(`In-app notification ${notification._id} delivered to user ${userId}`);
    
    return { delivered: true };
  } catch (error) {
    logger.error('Error delivering in-app notification:', error);
    throw error;
  }
};
// src/services/smsService.js
const twilio = require('twilio');
const config = require('../config');
const User = require('../models/user');
const logger = require('../utils/logger');

// Initialize Twilio client
const twilioClient = twilio(config.sms.accountSid, config.sms.authToken);

/**
 * Send SMS notification
 * @param {Object} notification - Notification object
 */
exports.sendSms = async (notification) => {
  try {
    const { userId, content, data } = notification;
    
    // Get user phone number
    const user = await User.findOne({ userId });
    
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }
    
    if (!user.phoneNumber) {
      throw new Error(`Phone number not found for user: ${userId}`);
    }
    
    // Check user preferences
    if (user.notificationPreferences?.sms?.enabled === false) {
      logger.info(`SMS notifications disabled for user ${userId}`);
      return { skipped: true, reason: 'User has disabled SMS notifications' };
    }
    
    // Send SMS
    const message = await twilioClient.messages.create({
      body: content,
      from: data?.from || config.sms.phoneNumber,
      to: user.phoneNumber,
    });
    
    logger.info(`SMS sent to ${user.phoneNumber}: ${message.sid}`);
    
    return { sent: true, messageId: message.sid };
  } catch (error) {
    logger.error('Error sending SMS:', error);
    throw error;
  }
};
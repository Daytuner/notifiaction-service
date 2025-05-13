// src/services/emailService.js
const nodemailer = require('nodemailer');
const config = require('../config');
const User = require('../models/user.js');
const logger = require('../utils/logger.js');

// Create transporter
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.auth.user,
    pass: config.email.auth.pass,
  },
});

/**
 * Send email notification
 * @param {Object} notification - Notification object
 */
exports.sendEmail = async (notification) => {
  try {
    const { userId, title, content, data } = notification;
    
    // Get user email
    const user = await User.findOne({ userId });
    
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }
    
    if (!user.email) {
      throw new Error(`Email address not found for user: ${userId}`);
    }
    
    // Check user preferences
    if (user.notificationPreferences?.email?.enabled === false) {
      logger.info(`Email notifications disabled for user ${userId}`);
      return { skipped: true, reason: 'User has disabled email notifications' };
    }
    
    // Prepare email options
    const mailOptions = {
      from: data?.from || config.email.from,
      to: user.email,
      subject: title,
      text: content,
      html: data?.html || `<p>${content}</p>`,
    };
    
    // Add CC if present
    if (data?.cc) {
      mailOptions.cc = data?.cc;
    }
    
    // Add attachments if present
    if (data?.attachments) {
      mailOptions.attachments = data?.attachments;
    }
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    logger.info(`Email sent to ${user.email}: ${info.messageId}`);
    
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Error sending email:', error);
    throw error;
  }
};
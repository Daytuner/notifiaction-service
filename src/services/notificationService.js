// src/services/notificationService.js
const emailService = require('./emailService.js');
const smsService = require('./smsService.js');
const inAppService = require('./inAppService.js');
const queueProducer = require('../queue/producer.js');
const Notification = require('../models/notification.js');
const config = require('../config');
const logger = require('../utils/logger.js');

/**
 * Queue a notification for processing
 * @param {Object} notification - Notification object
 */
exports.queueNotification = async (notification) => {
  try {
    const { type } = notification;
    
    // Select queue based on notification type
    let queueName;
    switch (type) {
      case 'EMAIL':
        queueName = config.queue.queues.email;
        break;
      case 'SMS':
        queueName = config.queue.queues.sms;
        break;
      case 'IN_APP':
        queueName = config.queue.queues.inApp;
        break;
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }
    
    // Send to queue
    await queueProducer.sendToQueue(queueName, notification);
    
    logger.info(`Notification ${notification._id} queued to ${queueName}`);
    
    return true;
  } catch (error) {
    logger.error(`Error queueing notification ${notification._id}:`, error);
    
    // Update notification status to FAILED
    await Notification.findByIdAndUpdate(notification._id, {
      status: 'FAILED',
      error: error.message,
    });
    
    throw error;
  }
};

/**
 * Process a notification
 * @param {Object} notification - Notification object
 */
exports.processNotification = async (notification) => {
  try {
    const { type } = notification;
    
    // Process based on notification type
    switch (type) {
      case 'EMAIL':
        await emailService.sendEmail(notification);
        break;
      case 'SMS':
        await smsService.sendSms(notification);
        break;
      case 'IN_APP':
        await inAppService.sendInApp(notification);
        break;
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }
    
    // Update notification status to SENT
    await Notification.findByIdAndUpdate(notification._id, {
      status: 'SENT',
    });
    
    logger.info(`Notification ${notification._id} processed successfully`);
    
    return true;
  } catch (error) {
    logger.error(`Error processing notification ${notification._id}:`, error);
    
    // Handle retry logic
    if (notification.retryCount < config.retry.attempts) {
      const nextRetryCount = notification.retryCount + 1;
      const nextRetryTime = new Date(Date.now() + config.retry.delay);
      
      await Notification.findByIdAndUpdate(notification._id, {
        status: 'PENDING',
        retryCount: nextRetryCount,
        nextRetry: nextRetryTime,
        error: error.message,
      });
      
      logger.info(`Scheduled retry ${nextRetryCount}/${config.retry.attempts} for notification ${notification._id} at ${nextRetryTime}`);
    } else {
      // Max retries reached, mark as failed
      await Notification.findByIdAndUpdate(notification._id, {
        status: 'FAILED',
        error: `Max retries reached. Last error: ${error.message}`,
      });
      
      logger.warn(`Max retries reached for notification ${notification._id}`);
    }
    
    throw error;
  }
};

/**
 * Schedule pending retry notifications
 */
exports.scheduleRetries = async () => {
  try {
    const now = new Date();
    
    // Find notifications that are due for retry
    const notifications = await Notification.find({
      status: 'PENDING',
      nextRetry: { $lte: now },
    }).limit(100);
    
    logger.info(`Found ${notifications.length} notifications due for retry`);
    
    // Queue each notification
    for (const notification of notifications) {
      await this.queueNotification(notification);
    }
    
    return notifications.length;
  } catch (error) {
    logger.error('Error scheduling retries:', error);
    throw error;
  }
};


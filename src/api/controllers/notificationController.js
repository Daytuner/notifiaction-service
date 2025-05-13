// src/api/controllers/notificationController.js
const Notification = require('../../models/notification.js');
const notificationService = require('../../services/notificationService.js');
const logger = require('../../utils/logger.js');

exports.sendNotification = async (req, res, next) => {
  try {
    const notificationData = req.body;
    
    // Create notification in database
    const notification = await Notification.create(notificationData);
    
    // Queue notification for processing
    await notificationService.queueNotification(notification);
    
    res.status(201).json({
      success: true,
      message: 'Notification queued successfully',
      data: {
        notificationId: notification._id,
      },
    });
  } catch (error) {
    logger.error('Error sending notification:', error);
    next(error);
  }
};

exports.getNotificationById = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    logger.error('Error getting notification:', error);
    next(error);
  }
};

exports.updateNotificationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['PENDING', 'SENT', 'FAILED', 'DELIVERED', 'READ'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }
    
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        ...(status === 'READ' ? { read: true } : {})
      },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    logger.error('Error updating notification status:', error);
    next(error);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting notification:', error);
    next(error);
  }
};
// src/api/controllers/userController.js
const Notification = require('../../models/notification.js');
const User = require('../../models/user.js');
const logger = require('../../utils/logger.js');




exports.createDemoUser = async (req, res, next) => {
  try {
    // Define demo user information
    // Use request body or default values
    const demoUserId = req.body.userId || 'demo-user-' + Date.now();
    const demoEmail = req.body.email || `demo-${demoUserId}@example.com`;
    const demoPhone = req.body.phoneNumber || '+15555555555';

    // Check if demo user with this ID already exists
    let demoUser = await User.findOne({ userId: demoUserId });
    
    // If user exists, return it
    if (demoUser) {
      return res.status(200).json({
        success: true,
        message: 'Demo user already exists',
        data: {
          userId: demoUser.userId,
          email: demoUser.email,
          phoneNumber: demoUser.phoneNumber,
          notificationPreferences: demoUser.notificationPreferences,
          createdAt: demoUser.createdAt
        }
      });
    }
    
    // Create demo user
    demoUser = await User.create({
      userId: demoUserId,
      email: demoEmail,
      phoneNumber: demoPhone,
      notificationPreferences: {
        email: { enabled: true },
        sms: { enabled: true },
        inApp: { enabled: true }
      }
    });
    
    logger.info(`Demo user created: ${demoUserId}`);
    
    res.status(201).json({
      success: true,
      message: 'Demo user created successfully',
      data: {
        userId: demoUser.userId,
        email: demoUser.email,
        phoneNumber: demoUser.phoneNumber,
        notificationPreferences: demoUser.notificationPreferences,
        createdAt: demoUser.createdAt
      }
    });
  } catch (error) {
    logger.error('Error creating demo user:', error);
    next(error);
  }
};

exports.getUserNotifications = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status = 'ALL', type, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = { userId: id, read: { $exists: true } };
    
    // Add filters if provided
    if (status !== 'ALL') {
      if (status === 'READ') {
        query.read = true;
      } else if (status === 'UNREAD') {
        query.read = false;
      }
    }
    
    if (type && ['EMAIL', 'SMS', 'IN_APP'].includes(type)) {
      query.type = type;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const totalCount = await Notification.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: {
        totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        notifications,
      },
    });
  } catch (error) {
    logger.error('Error getting user notifications:', error);
    next(error);
  }
};


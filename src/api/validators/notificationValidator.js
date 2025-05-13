// src/api/validators/notificationValidator.js
const Joi = require('joi');
const logger = require('../../utils/logger.js');

// Define validation schema
const notificationSchema = Joi.object({
  userId: Joi.string().required(),
  type: Joi.string().valid('EMAIL', 'SMS', 'IN_APP').required(),
  title: Joi.string().required(),
  content: Joi.string().required(),
  priority: Joi.string().valid('HIGH', 'MEDIUM', 'LOW').default('MEDIUM'),
  data: Joi.object().default({}),
});

/**
 * Validate notification request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.validateNotification = (req, res, next) => {
  const { error, value } = notificationSchema.validate(req.body);
  
  if (error) {
    logger.warn('Notification validation error:', error.details);
    
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map((detail) => detail.message),
    });
  }
  
  // Update request body with validated data
  req.body = value;
  
  next();
};
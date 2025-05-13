// src/config/index.js
require('dotenv').config();

module.exports = {
  app: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
  },
  db: {
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/notification-service'
  },
  queue: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost',
    exchange: 'notifications',
    queues: {
      email: 'email_notifications',
      sms: 'sms_notifications',
      inApp: 'in_app_notifications',
    },
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    from: process.env.EMAIL_FROM || 'noreply@example.com',
  },
  sms: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },
  retry: {
    attempts: process.env.RETRY_ATTEMPTS || 3,
    delay: process.env.RETRY_DELAY || 60000, // 1 minute
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
};


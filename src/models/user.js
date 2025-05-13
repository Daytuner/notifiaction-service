// src/models/user.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNumber: {
      type: String,
    },
    notificationPreferences: {
      email: {
        enabled: {
          type: Boolean,
          default: true,
        },
      },
      sms: {
        enabled: {
          type: Boolean,
          default: true,
        },
      },
      inApp: {
        enabled: {
          type: Boolean,
          default: true,
        },
      },
    },
    deviceTokens: [
      {
        token: String,
        platform: {
          type: String,
          enum: ['ios', 'android', 'web'],
        },
        lastActive: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
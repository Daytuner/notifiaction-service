// src/app.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { json, urlencoded } = express;

const config = require('./config');
const notificationRoutes = require('./api/routes/notificationRoutes.js');
const userRoutes = require('./api/routes/userRoutes.js');
const errorHandler = require('./utils/errorHandler.js');
const logger = require('./utils/logger.js');
const consumer = require('./queue/consumer.js');

// Start consuming messages when the application starts
consumer.initialize().catch((error) => {
  console.error('Failed to initialize queue consumer:', error);
});

// Initialize express app
const app = express();

// Connect to MongoDB
mongoose
  .connect(config.db.url, config.db.options)
  .then(() => {
    logger.info('Connected to MongoDB');
  })
  .catch((err) => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Middleware
app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));

// Routes
app.use('/notifications', notificationRoutes);
app.use('/users', userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Error handling middleware
app.use(errorHandler);

// Start the server
const PORT = config.app.port || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = app;
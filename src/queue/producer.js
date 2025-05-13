// src/queue/producer.js
const amqp = require('amqplib');
const config = require('../config');
const logger = require('../utils/logger.js');

let connection = null;
let channel = null;

/**
 * Initialize connection to RabbitMQ
 */
const initialize = async () => {
  try {
    // Connect to RabbitMQ
    connection = await amqp.connect(config.queue.url);
    channel = await connection.createChannel();
    
    // Make sure queues exist
    await channel.assertExchange(config.queue.exchange, 'direct', { durable: true });
    
    // Assert queues
    await channel.assertQueue(config.queue.queues.email, { durable: true });
    await channel.assertQueue(config.queue.queues.sms, { durable: true });
    await channel.assertQueue(config.queue.queues.inApp, { durable: true });
    
    // Bind queues to exchange
    await channel.bindQueue(config.queue.queues.email, config.queue.exchange, 'email');
    await channel.bindQueue(config.queue.queues.sms, config.queue.exchange, 'sms');
    await channel.bindQueue(config.queue.queues.inApp, config.queue.exchange, 'in_app');
    
    logger.info('Connected to RabbitMQ');
    
    return { connection, channel };
  } catch (error) {
    logger.error('Error connecting to RabbitMQ:', error);
    throw error;
  }
};

/**
 * Send message to queue
 * @param {string} queue - Queue name
 * @param {Object} message - Message to send
 */
exports.sendToQueue = async (queue, message) => {
  try {
    // Initialize if not already
    if (!channel) {
      await initialize();
    }
    
    // Send message to queue
    await channel.sendToQueue(
      queue,
      Buffer.from(JSON.stringify(message)),
      {
        persistent: true,
        contentType: 'application/json',
      }
    );
    
    logger.debug(`Message sent to queue ${queue}`);
    
    return true;
  } catch (error) {
    logger.error(`Error sending message to queue ${queue}:`, error);
    
    // Try to reconnect on error
    channel = null;
    connection = null;
    
    throw error;
  }
};

/**
 * Close connection to RabbitMQ
 */
exports.close = async () => {
  try {
    if (channel) {
      await channel.close();
    }
    if (connection) {
      await connection.close();
    }
    
    channel = null;
    connection = null;
    
    logger.info('Disconnected from RabbitMQ');
    
    return true;
  } catch (error) {
    logger.error('Error closing RabbitMQ connection:', error);
    throw error;
  }
};

// Initialize connection when module is loaded
initialize().catch((error) => {
  logger.error('Error initializing RabbitMQ connection:', error);
});

// Re-export initialize for testing
exports.initialize = initialize;
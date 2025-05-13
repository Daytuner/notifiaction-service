// src/queue/consumer.js
const amqp = require('amqplib');
const config = require('../config');
const notificationService = require('../services/notificationService.js');
const logger = require('../utils/logger.js');

let connection = null;
let channel = null;

/**
 * Initialize connection to RabbitMQ and start consuming messages
 */
const initialize = async () => {
  try {
    // Connect to RabbitMQ
    connection = await amqp.connect(config.queue.url);
    channel = await connection.createChannel();
    
    // Make sure queues exist
    await channel.assertExchange(config.queue.exchange, 'direct', { durable: true });
    
    // Consume email notifications
    await consumeQueue(config.queue.queues.email);
    
    // Consume SMS notifications
    await consumeQueue(config.queue.queues.sms);
    
    // Consume in-app notifications
    await consumeQueue(config.queue.queues.inApp);
    
    logger.info('Started consuming from RabbitMQ queues');
    
    return { connection, channel };
  } catch (error) {
    logger.error('Error initializing RabbitMQ consumer:', error);
    throw error;
  }
};

/**
 * Consume messages from a queue
 * @param {string} queue - Queue name
 */
const consumeQueue = async (queue) => {
  try {
    // Assert queue
    await channel.assertQueue(queue, { durable: true });
    
    // Set prefetch to 1 to distribute load
    await channel.prefetch(1);
    
    // Start consuming
    await channel.consume(queue, async (msg) => {
      if (!msg) return;
      
      try {
        // Parse message
        const notification = JSON.parse(msg.content.toString());
        
        logger.debug(`Processing notification ${notification._id} from queue ${queue}`);
        
        // Process notification
        await notificationService.processNotification(notification);
        
        // Acknowledge message
        channel.ack(msg);
        
        logger.debug(`Notification ${notification._id} processed successfully`);
      } catch (error) {
        logger.error(`Error processing message from queue ${queue}:`, error);
        
        // Reject message and requeue
        channel.nack(msg, false, false);
      }
    });
    
    logger.info(`Started consuming from queue ${queue}`);
    
    return true;
  } catch (error) {
    logger.error(`Error consuming from queue ${queue}:`, error);
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
    
    logger.info('Closed RabbitMQ consumer connection');
    
    return true;
  } catch (error) {
    logger.error('Error closing RabbitMQ consumer connection:', error);
    throw error;
  }
};

// Re-export functions for testing
exports.initialize = initialize;
exports.consumeQueue = consumeQueue;

// Start consuming when module is loaded
initialize().catch((error) => {
  logger.error('Error starting RabbitMQ consumer:', error);
});
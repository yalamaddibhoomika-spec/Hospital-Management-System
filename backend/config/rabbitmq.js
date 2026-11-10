const amqp = require('amqplib');

let channel;

const setupRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();
    await channel.assertQueue('alert_queue', { durable: true });
    console.log('RabbitMQ Connected');
  } catch (error) {
    console.error('RabbitMQ Connection Error:', error);
  }
};

const publishToQueue = async (queue, message) => {
  if (!channel) {
    console.error('RabbitMQ channel not established');
    return;
  }
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
};

module.exports = { setupRabbitMQ, publishToQueue };

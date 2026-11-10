const HealthData = require('../models/HealthData');
const { redisClient } = require('../config/db');
const { publishToQueue } = require('../config/rabbitmq');
const { Client } = require('@elastic/elasticsearch');

const esClient = new Client({ node: 'http://localhost:9200' });

exports.addHealthData = async (req, res) => {
  const { heartRate, bloodPressureSys, bloodPressureDia, oxygenSaturation, bodyTemperature } = req.body;

  try {
    const healthData = await HealthData.create({
      user: req.user.id,
      heartRate,
      bloodPressureSys,
      bloodPressureDia,
      oxygenSaturation,
      bodyTemperature,
    });

    // Cache in Redis (Latest reading)
    await redisClient.set(`health:${req.user.id}:latest`, JSON.stringify(healthData), { EX: 3600 });

    // Real-time update via Socket.io
    const io = req.app.get('io');
    io.emit('healthUpdate', healthData);

    // Check for abnormalities and publish to RabbitMQ
    if (heartRate > 100 || bodyTemperature > 38 || oxygenSaturation < 95) {
      await publishToQueue('alert_queue', {
        type: 'CRITICAL_VITALS',
        data: healthData,
        userId: req.user.id
      });
    }

    // Index to Elasticsearch
    try {
      await esClient.index({
        index: 'health-readings',
        document: {
          userId: req.user.id,
          heartRate,
          bloodPressureSys,
          bloodPressureDia,
          oxygenSaturation,
          bodyTemperature,
          timestamp: new Date(),
        }
      });
    } catch (esError) {
      console.error('Elasticsearch Index Error:', esError);
    }

    res.status(201).json(healthData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getHealthHistory = async (req, res) => {
  try {
    // Check Redis Cache for history (optional implementation, here we just check latest)
    // For full history, usually we query DB directly or cache paginated results.

    const history = await HealthData.find({ user: req.user.id })
      .sort({ timestamp: -1 })
      .limit(20)
      .populate({
        path: 'user',
        select: 'name email assignedDoctor',
        populate: {
          path: 'assignedDoctor',
          select: 'name specialization profilePicture'
        }
      });

    // Flatten the structure for easier frontend consumption if needed, 
    // or frontend can access via reading.user.assignedDoctor
    // But to keep it compatible with current frontend logic which expects 'assignedDoctor' on the reading object:
    const historyWithDoctor = history.map(reading => {
      const readingObj = reading.toObject();
      if (reading.user && reading.user.assignedDoctor) {
        readingObj.assignedDoctor = reading.user.assignedDoctor;
      }
      return readingObj;
    });

    res.json(historyWithDoctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

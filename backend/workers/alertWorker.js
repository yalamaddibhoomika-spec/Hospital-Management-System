const amqp = require('amqplib');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const User = require('../models/User');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Worker connected to MongoDB'))
  .catch(err => console.error('Worker MongoDB connection error:', err));

// Configure Email Transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Configure Twilio Client
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

const sendEmailAlert = async (doctorEmail, patientName, vitalData) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: doctorEmail,
      subject: `CRITICAL ALERT: ${patientName} - Abnormal Vitals`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #ef4444;">Critical Health Alert</h2>
          <p><strong>Patient:</strong> ${patientName}</p>
          <p>The following critical vitals were recorded just now:</p>
          <ul>
            <li><strong>Heart Rate:</strong> ${vitalData.heartRate} bpm</li>
            <li><strong>Blood Pressure:</strong> ${vitalData.bloodPressureSys}/${vitalData.bloodPressureDia} mmHg</li>
            <li><strong>Oxygen Saturation:</strong> ${vitalData.oxygenSaturation}%</li>
            <li><strong>Temperature:</strong> ${vitalData.bodyTemperature}°C</li>
          </ul>
          <p>Please take immediate action.</p>
          <p style="font-size: 12px; color: #64748b;">VitalSense Monitoring System</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[Email] Alert sent to ${doctorEmail} for ${patientName}`);
  } catch (error) {
    console.error('[Email] Failed to send alert:', error);
  }
};

const sendSMSAlert = async (doctorPhone, patientName, vitalData) => {
  try {
    if (!doctorPhone) return;

    const message = `CRITICAL ALERT: Patient ${patientName} has abnormal vitals. HR: ${vitalData.heartRate}, BP: ${vitalData.bloodPressureSys}/${vitalData.bloodPressureDia}, O2: ${vitalData.oxygenSaturation}%. Please check immediately. - VitalSense`;

    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: doctorPhone,
    });
    console.log(`[SMS] Alert sent to ${doctorPhone} for ${patientName}`);
  } catch (error) {
    console.error('[SMS] Failed to send alert:', error);
  }
};

const startWorker = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    const channel = await connection.createChannel();
    const queue = 'alert_queue';

    await channel.assertQueue(queue, { durable: true });
    console.log(`Waiting for messages in ${queue}. To exit press CTRL+C`);

    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        const alert = JSON.parse(msg.content.toString());
        console.log(" [x] Received Alert:", alert);

        if (alert.type === 'CRITICAL_VITALS' && alert.userId) {
          try {
            // Fetch patient and assigned doctor
            const patient = await User.findById(alert.userId).populate('assignedDoctor');

            if (patient && patient.assignedDoctor) {
              const doctor = patient.assignedDoctor;

              console.log(`Processing alert for patient: ${patient.name}, Doctor: ${doctor.name}`);

              // Send Email
              if (doctor.email) {
                await sendEmailAlert(doctor.email, patient.name, alert.data);
              }

              // Send SMS
              if (doctor.phone) {
                await sendSMSAlert(doctor.phone, patient.name, alert.data);
              }
            } else {
              console.log('Patient has no assigned doctor or patient not found.');
            }
          } catch (err) {
            console.error('Error processing alert data:', err);
          }
        }

        channel.ack(msg);
      }
    });
  } catch (error) {
    console.error('Worker Error:', error);
  }
};

startWorker();

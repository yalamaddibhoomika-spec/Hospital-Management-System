const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    try {
      // Find a patient with an assigned doctor
      const patient = await User.findOne({ role: 'patient', assignedDoctor: { $ne: null } }).populate('assignedDoctor');

      if (patient) {
        console.log(`Patient: ${patient.name}`);
        console.log(`Assigned Doctor: ${patient.assignedDoctor.name}`);
        console.log(`Doctor Phone: ${patient.assignedDoctor.phone || 'NOT SET'}`);
      } else {
        console.log('No patient with assigned doctor found.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      process.exit();
    }
  });

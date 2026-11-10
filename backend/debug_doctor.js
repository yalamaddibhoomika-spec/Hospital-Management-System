const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    try {
      const patients = await User.find({ role: 'patient' });
      console.log('Total Patients:', patients.length);
      for (const p of patients) {
        console.log(`Patient: ${p.name}, AssignedDoctor: ${p.assignedDoctor} (Type: ${typeof p.assignedDoctor})`);
        if (p.assignedDoctor) {
          const doc = await User.findById(p.assignedDoctor);
          console.log(`  -> Doctor Found: ${doc ? doc.name : 'NULL'}`);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      process.exit();
    }
  });

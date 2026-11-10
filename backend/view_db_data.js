const mongoose = require('mongoose');
const User = require('./models/User');
const HealthData = require('./models/HealthData');
const Suggestion = require('./models/Suggestion');

const viewData = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/health-monitoring');
    console.log('Connected to MongoDB');

    console.log('\n--- USERS ---');
    const users = await User.find({});
    users.forEach(u => {
      console.log(`Name: ${u.name}, Role: ${u.role}, Email: ${u.email}`);
      if (u.role === 'patient') {
        console.log(`  Age: ${u.age}, Blood Group: ${u.bloodGroup}, Allergies: ${u.allergies}`);
      }
    });

    console.log('\n--- RECENT HEALTH DATA (Last 5) ---');
    const healthData = await HealthData.find({}).sort({ timestamp: -1 }).limit(5).populate('user', 'name');
    healthData.forEach(h => {
      console.log(`Patient: ${h.user?.name}, Time: ${h.timestamp}`);
      console.log(`  HR: ${h.heartRate}, BP: ${h.bloodPressureSys}/${h.bloodPressureDia}, O2: ${h.oxygenSaturation}, Temp: ${h.bodyTemperature}`);
    });

    console.log('\n--- SUGGESTIONS ---');
    const suggestions = await Suggestion.find({}).populate('doctor', 'name').populate('patient', 'name');
    suggestions.forEach(s => {
      console.log(`From Dr. ${s.doctor?.name} to ${s.patient?.name} (${s.priority}): "${s.message}"`);
    });

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

viewData();

const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    try {
      const doctors = await User.find({ role: 'doctor' });
      console.log('Total Doctors:', doctors.length);
      doctors.forEach(d => console.log(`- ${d.name} (${d.phone})`));
    } catch (e) {
      console.error(e);
    } finally {
      process.exit();
    }
  });

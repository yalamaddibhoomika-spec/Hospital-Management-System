const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const checkAdvice = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    let output = 'Connected to DB\n';

    const patients = await User.find({ role: 'patient' });
    const doctors = await User.find({ role: 'doctor' });

    output += '--- Doctors ---\n';
    doctors.forEach(d => {
      output += `Doctor: ${d.name}\n`;
      output += `ID: ${d._id}\n`;
      output += '-------------------------\n';
    });

    output += '--- Patients Advice Status ---\n';
    patients.forEach(p => {
      output += `Patient: ${p.name}\n`;
      output += `ID: ${p._id}\n`;
      output += `Last Advice Sent At: ${p.lastAdviceSentAt}\n`;
      output += '-------------------------\n';
    });

    fs.writeFileSync('db_check_output.txt', output);
    console.log('Output written to db_check_output.txt');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

checkAdvice();

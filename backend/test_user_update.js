const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const testUpdate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Use Vimratha's ID from the DB check
    const patientId = '69288d2887532e854f0a2cf1';

    console.log(`\nAttempting to update patient: ${patientId}`);
    console.log(`Setting lastAdviceSentAt to: ${new Date()}`);

    const result = await User.findByIdAndUpdate(
      patientId,
      { lastAdviceSentAt: new Date() },
      { new: true } // Return the updated document
    );

    console.log('\n--- Update Result ---');
    console.log('Patient Name:', result?.name);
    console.log('Patient ID:', result?._id);
    console.log('lastAdviceSentAt:', result?.lastAdviceSentAt);
    console.log('Full Document:', JSON.stringify(result, null, 2));

    // Verify by fetching again
    console.log('\n--- Verification Fetch ---');
    const verified = await User.findById(patientId);
    console.log('lastAdviceSentAt (verified):', verified?.lastAdviceSentAt);

    process.exit();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testUpdate();

const HealthData = require('../models/HealthData');
const User = require('../models/User');

// Get all patients assigned to the doctor with their latest vitals
exports.getAllPatients = async (req, res) => {
  try {
    // Get all users with role 'patient' assigned to this doctor
    const patients = await User.find({
      role: 'patient',
      assignedDoctor: req.user._id
    }).select('-password');

    // For each patient, get their latest health reading
    const patientsWithVitals = await Promise.all(
      patients.map(async (patient) => {
        const latestReading = await HealthData.findOne({ user: patient._id })
          .sort({ timestamp: -1 })
          .limit(1);

        return {
          _id: patient._id,
          name: patient.name,
          email: patient.email,
          profilePicture: patient.profilePicture,
          age: patient.age,
          latestVitals: latestReading || null,
          lastAdviceSentAt: patient.lastAdviceSentAt,
        };
      })
    );

    res.json(patientsWithVitals);
  } catch (error) {
    console.error('Get all patients error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get specific patient's full health history
exports.getPatientHistory = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Get patient info
    const patient = await User.findById(patientId).select('-password');
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Get all health readings for this patient
    const readings = await HealthData.find({ user: patientId })
      .sort({ timestamp: -1 })
      .limit(50);

    res.json({
      patient: {
        _id: patient._id,
        name: patient.name,
        email: patient.email,
        age: patient.age,
        profilePicture: patient.profilePicture,
      },
      readings,
    });
  } catch (error) {
    console.error('Get patient history error:', error);
    res.status(500).json({ message: error.message });
  }
};

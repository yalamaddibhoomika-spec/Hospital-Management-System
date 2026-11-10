const User = require('../models/User');

// Get list of all doctors
exports.getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' })
      .select('name specialization profilePicture bio yearsOfExperience');
    res.json(doctors);
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Assign a doctor to the current patient
exports.assignDoctor = async (req, res) => {
  try {
    const { doctorId } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    user.assignedDoctor = doctorId;
    await user.save();

    // Return updated user
    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('assignedDoctor', 'name specialization profilePicture');

    res.json(updatedUser);
  } catch (error) {
    console.error('Assign doctor error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get public patient profile (for QR verification)
exports.getPublicPatientProfile = async (req, res) => {
  try {
    const patient = await User.findById(req.params.id).select('name age bloodGroup allergies assignedDoctor createdAt');

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    let doctorName = 'Not Assigned';
    if (patient.assignedDoctor) {
      const doctor = await User.findById(patient.assignedDoctor).select('name specialization');
      if (doctor) {
        doctorName = `Dr. ${doctor.name} (${doctor.specialization || 'General'})`;
      }
    }

    res.json({
      name: patient.name,
      age: patient.age,
      bloodGroup: patient.bloodGroup,
      allergies: patient.allergies,
      doctor: doctorName,
      memberSince: patient.createdAt
    });
  } catch (error) {
    console.error('Error fetching public profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

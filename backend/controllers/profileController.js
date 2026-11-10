const User = require('../models/User');

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('assignedDoctor', 'name email specialization phone');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, specialization, bio, phone, licenseNumber, yearsOfExperience, profilePicture } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (specialization !== undefined) user.specialization = specialization;
    if (bio !== undefined) user.bio = bio;
    if (phone !== undefined) user.phone = phone;
    if (licenseNumber !== undefined) user.licenseNumber = licenseNumber;
    if (yearsOfExperience !== undefined) user.yearsOfExperience = yearsOfExperience;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;
    if (req.body.age !== undefined) user.age = req.body.age;
    if (req.body.weight !== undefined) user.weight = req.body.weight;
    if (req.body.bloodGroup !== undefined) user.bloodGroup = req.body.bloodGroup;
    if (req.body.allergies !== undefined) user.allergies = req.body.allergies;
    if (req.body.medications !== undefined) user.medications = req.body.medications;

    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(user._id).select('-password').populate('assignedDoctor', 'name email specialization phone');
    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: error.message });
  }
};

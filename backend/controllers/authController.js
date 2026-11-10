const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
};

exports.registerUser = async (req, res) => {
  const { name, email, password, role, specialization } = req.body;
  console.log('Registration attempt:', { name, email, role });
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    console.log('Creating new user...');
    const user = await User.create({ name, email, password, role, specialization });
    console.log('User created successfully:', user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      specialization: user.specialization,
      bio: user.bio,
      phone: user.phone,
      licenseNumber: user.licenseNumber,
      yearsOfExperience: user.yearsOfExperience,
      profilePicture: user.profilePicture,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).populate('assignedDoctor', 'name email specialization phone');
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        specialization: user.specialization,
        bio: user.bio,
        phone: user.phone,
        licenseNumber: user.licenseNumber,
        yearsOfExperience: user.yearsOfExperience,
        profilePicture: user.profilePicture,
        assignedDoctor: user.assignedDoctor, // Include populated doctor
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

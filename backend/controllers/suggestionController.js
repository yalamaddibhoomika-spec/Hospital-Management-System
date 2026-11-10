const Suggestion = require('../models/Suggestion');
const User = require('../models/User');

exports.createSuggestion = async (req, res) => {
  const { patientId, message, priority } = req.body;
  const doctorId = req.user.id;

  try {
    const suggestion = await Suggestion.create({
      doctor: doctorId,
      patient: patientId,
      message,
      priority: priority || 'Normal'
    });

    const populatedSuggestion = await Suggestion.findById(suggestion._id)
      .populate('doctor', 'name specialization profilePicture');

    // Real-time update via Socket.io
    const io = req.app.get('io');
    io.emit('newSuggestion', populatedSuggestion);

    // Update patient's lastAdviceSentAt
    console.log(`Updating lastAdviceSentAt for patient: ${patientId}`);
    const updateRes = await User.findByIdAndUpdate(patientId, { lastAdviceSentAt: new Date() }, { new: true });
    console.log('Update Result:', updateRes);

    res.status(201).json(populatedSuggestion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPatientSuggestions = async (req, res) => {
  try {
    // If patient requests, use their ID. If doctor requests, use query param.
    const patientId = req.user.role === 'patient' ? req.user.id : req.query.patientId;

    if (!patientId) {
      return res.status(400).json({ message: 'Patient ID required' });
    }

    const suggestions = await Suggestion.find({ patient: patientId })
      .sort({ timestamp: -1 })
      .populate('doctor', 'name specialization profilePicture');

    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Suggestion.findByIdAndUpdate(id, { isRead: true });
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

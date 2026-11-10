const express = require('express');
const { getAllPatients, getPatientHistory } = require('../controllers/doctorController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// All routes require authentication
router.get('/patients', protect, getAllPatients);
router.get('/patient/:patientId', protect, getPatientHistory);

module.exports = router;

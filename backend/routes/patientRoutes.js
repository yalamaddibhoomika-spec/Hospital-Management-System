const express = require('express');
const { getDoctors, assignDoctor, getPublicPatientProfile } = require('../controllers/patientController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// All routes require authentication
router.get('/doctors', protect, getDoctors);
router.put('/assign-doctor', protect, assignDoctor);

// Public route for verification (No auth required)
router.get('/public/:id', getPublicPatientProfile);

module.exports = router;

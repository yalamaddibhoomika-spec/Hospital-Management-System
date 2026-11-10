const express = require('express');
const { generateHealthReport, generatePatientReport } = require('../controllers/pdfController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Patient generates their own health report
router.get('/health-report', protect, generateHealthReport);

// Doctor generates report for a specific patient
router.get('/patient-report/:patientId', protect, generatePatientReport);

module.exports = router;

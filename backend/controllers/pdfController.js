const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const User = require('../models/User');
const HealthData = require('../models/HealthData');
const Suggestion = require('../models/Suggestion');

// Generate Health Report PDF
const generateHealthReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    // Fetch user data
    const user = await User.findById(userId).populate('assignedDoctor');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Set date range (default to last 30 days)
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch health data for the period
    const healthData = await HealthData.find({
      user: userId,
      timestamp: { $gte: start, $lte: end }
    }).sort({ timestamp: 1 });

    // Fetch suggestions for the period
    const suggestions = await Suggestion.find({
      patient: userId,
      timestamp: { $gte: start, $lte: end }
    }).populate('doctor').sort({ timestamp: -1 });

    // Calculate summary statistics
    const stats = calculateStats(healthData);

    // Generate QR code for verification
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-report/${userId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);

    // Create PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=HealthNexus_Report_${user.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Build PDF content
    addHeader(doc, qrCodeDataUrl);
    addPatientInfo(doc, user);
    addReportPeriod(doc, start, end);
    addSummaryStats(doc, stats);
    addDoctorAdvice(doc, suggestions);
    addMedications(doc, user.medications || []);
    addFooter(doc);

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Error generating health report', error: error.message });
  }
};

// Generate report for a patient (Doctor access)
const generatePatientReport = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify doctor role
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctors only.' });
    }

    // Fetch patient data
    const patient = await User.findById(patientId).populate('assignedDoctor');
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Verify doctor is assigned to this patient
    if (patient.assignedDoctor && patient.assignedDoctor._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not assigned to this patient' });
    }

    // Set date range
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch health data
    const healthData = await HealthData.find({
      user: patientId,
      timestamp: { $gte: start, $lte: end }
    }).sort({ timestamp: 1 });

    // Fetch suggestions
    const suggestions = await Suggestion.find({
      patient: patientId,
      timestamp: { $gte: start, $lte: end }
    }).populate('doctor').sort({ timestamp: -1 });

    // Calculate stats
    const stats = calculateStats(healthData);

    // Generate QR code
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-report/${patientId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);

    // Create PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=HealthNexus_Report_${patient.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);

    doc.pipe(res);

    addHeader(doc, qrCodeDataUrl);
    addPatientInfo(doc, patient);
    addReportPeriod(doc, start, end);
    addSummaryStats(doc, stats);
    addDoctorAdvice(doc, suggestions);
    addMedications(doc, patient.medications || []);
    addFooter(doc);

    doc.end();

  } catch (error) {
    console.error('Error generating patient report:', error);
    res.status(500).json({ message: 'Error generating patient report', error: error.message });
  }
};

// Helper: Calculate summary statistics
function calculateStats(healthData) {
  if (healthData.length === 0) {
    return {
      heartRate: { avg: 0, min: 0, max: 0 },
      bloodPressureSys: { avg: 0, min: 0, max: 0 },
      bloodPressureDia: { avg: 0, min: 0, max: 0 },
      oxygenSaturation: { avg: 0, min: 0, max: 0 },
      bodyTemperature: { avg: 0, min: 0, max: 0 }
    };
  }

  const stats = {
    heartRate: { sum: 0, min: Infinity, max: -Infinity },
    bloodPressureSys: { sum: 0, min: Infinity, max: -Infinity },
    bloodPressureDia: { sum: 0, min: Infinity, max: -Infinity },
    oxygenSaturation: { sum: 0, min: Infinity, max: -Infinity },
    bodyTemperature: { sum: 0, min: Infinity, max: -Infinity }
  };

  healthData.forEach(data => {
    ['heartRate', 'bloodPressureSys', 'bloodPressureDia', 'oxygenSaturation', 'bodyTemperature'].forEach(key => {
      const value = data[key];
      if (value) {
        stats[key].sum += value;
        stats[key].min = Math.min(stats[key].min, value);
        stats[key].max = Math.max(stats[key].max, value);
      }
    });
  });

  const count = healthData.length;
  return {
    heartRate: { avg: (stats.heartRate.sum / count).toFixed(1), min: stats.heartRate.min, max: stats.heartRate.max },
    bloodPressureSys: { avg: (stats.bloodPressureSys.sum / count).toFixed(1), min: stats.bloodPressureSys.min, max: stats.bloodPressureSys.max },
    bloodPressureDia: { avg: (stats.bloodPressureDia.sum / count).toFixed(1), min: stats.bloodPressureDia.min, max: stats.bloodPressureDia.max },
    oxygenSaturation: { avg: (stats.oxygenSaturation.sum / count).toFixed(1), min: stats.oxygenSaturation.min, max: stats.oxygenSaturation.max },
    bodyTemperature: { avg: (stats.bodyTemperature.sum / count).toFixed(1), min: stats.bodyTemperature.min, max: stats.bodyTemperature.max }
  };
}

// Helper: Add header with logo and QR code
function addHeader(doc, qrCodeDataUrl) {
  // Title
  doc.fontSize(24).fillColor('#14b8a6').text('HealthNexus', 50, 50);
  doc.fontSize(12).fillColor('#64748b').text('Real-Time Health Monitoring System', 50, 80);

  // QR Code (top right)
  const qrImage = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
  doc.image(qrImage, 450, 50, { width: 80 });
  doc.fontSize(8).fillColor('#94a3b8').text('Scan to verify', 460, 135, { width: 60, align: 'center' });

  // Report title
  doc.fontSize(18).fillColor('#1e293b').text('Health Report', 50, 160);
  doc.fontSize(10).fillColor('#64748b').text(`Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, 185);

  // Horizontal line
  doc.moveTo(50, 210).lineTo(545, 210).stroke('#e2e8f0');

  return 230; // Return Y position for next section
}

// Helper: Add patient information
function addPatientInfo(doc, user) {
  let y = 230;

  doc.fontSize(14).fillColor('#0f172a').text('Patient Information', 50, y);
  y += 25;

  const info = [
    ['Name:', user.name],
    ['Age:', user.age || 'N/A'],
    ['Blood Group:', user.bloodGroup || 'Not specified'],
    ['Allergies:', user.allergies && user.allergies.length > 0 ? user.allergies.join(', ') : 'None reported'],
    ['Assigned Doctor:', user.assignedDoctor ? `Dr. ${user.assignedDoctor.name}` : 'Not assigned']
  ];

  info.forEach(([label, value]) => {
    doc.fontSize(10).fillColor('#475569').text(label, 50, y, { continued: true, width: 150 });
    doc.fillColor('#1e293b').text(value, { width: 350 });
    y += 20;
  });

  y += 10;
  doc.moveTo(50, y).lineTo(545, y).stroke('#e2e8f0');

  return y + 20;
}

// Helper: Add report period
function addReportPeriod(doc, start, end) {
  const y = doc.y + 10;

  doc.fontSize(14).fillColor('#0f172a').text('Report Period', 50, y);
  doc.fontSize(10).fillColor('#475569').text(
    `${start.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    50, y + 25
  );

  const newY = y + 55;
  doc.moveTo(50, newY).lineTo(545, newY).stroke('#e2e8f0');

  doc.y = newY + 20;
}

// Helper: Add summary statistics
function addSummaryStats(doc, stats) {
  let y = doc.y;

  doc.fontSize(14).fillColor('#0f172a').text('Summary Statistics', 50, y);
  y += 30;

  // Table header
  doc.fontSize(9).fillColor('#64748b');
  doc.text('Vital Sign', 50, y, { width: 150 });
  doc.text('Average', 200, y, { width: 80, align: 'center' });
  doc.text('Minimum', 280, y, { width: 80, align: 'center' });
  doc.text('Maximum', 360, y, { width: 80, align: 'center' });
  doc.text('Unit', 440, y, { width: 100 });

  y += 20;
  doc.moveTo(50, y).lineTo(545, y).stroke('#cbd5e1');
  y += 10;

  // Table rows
  const vitals = [
    ['Heart Rate', stats.heartRate, 'bpm'],
    ['Blood Pressure (Sys)', stats.bloodPressureSys, 'mmHg'],
    ['Blood Pressure (Dia)', stats.bloodPressureDia, 'mmHg'],
    ['Oxygen Saturation', stats.oxygenSaturation, '%'],
    ['Body Temperature', stats.bodyTemperature, '°C']
  ];

  doc.fontSize(10).fillColor('#1e293b');
  vitals.forEach(([name, data, unit]) => {
    doc.text(name, 50, y, { width: 150 });
    doc.text(data.avg, 200, y, { width: 80, align: 'center' });
    doc.text(data.min, 280, y, { width: 80, align: 'center' });
    doc.text(data.max, 360, y, { width: 80, align: 'center' });
    doc.text(unit, 440, y, { width: 100 });
    y += 25;
  });

  y += 10;
  doc.moveTo(50, y).lineTo(545, y).stroke('#e2e8f0');

  doc.y = y + 20;
}

// Helper: Add doctor's advice
function addDoctorAdvice(doc, suggestions) {
  let y = doc.y;

  // Check if we need a new page
  if (y > 650) {
    doc.addPage();
    y = 50;
  }

  doc.fontSize(14).fillColor('#0f172a').text('Doctor\'s Advice', 50, y);
  y += 25;

  if (suggestions.length === 0) {
    doc.fontSize(10).fillColor('#64748b').text('No advice received during this period.', 50, y);
    y += 30;
  } else {
    suggestions.forEach((suggestion, index) => {
      // Check if we need a new page for this suggestion
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      const priorityColor = suggestion.priority === 'Critical' ? '#ef4444' : suggestion.priority === 'High' ? '#f97316' : '#14b8a6';

      doc.fontSize(9).fillColor('#64748b').text(
        `${new Date(suggestion.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} - Dr. ${suggestion.doctor?.name || 'Unknown'}`,
        50, y
      );

      doc.fontSize(8).fillColor(priorityColor).text(
        suggestion.priority,
        450, y,
        { width: 95, align: 'right' }
      );

      y += 18;
      doc.fontSize(10).fillColor('#1e293b').text(suggestion.message, 50, y, { width: 495 });
      y += doc.heightOfString(suggestion.message, { width: 495 }) + 15;

      if (index < suggestions.length - 1) {
        doc.moveTo(50, y).lineTo(545, y).stroke('#f1f5f9');
        y += 15;
      }
    });
  }

  y += 10;
  doc.moveTo(50, y).lineTo(545, y).stroke('#e2e8f0');

  doc.y = y + 20;
}

// Helper: Add medications
function addMedications(doc, medications) {
  let y = doc.y;

  // Check if we need a new page
  if (y > 650) {
    doc.addPage();
    y = 50;
  }

  doc.fontSize(14).fillColor('#0f172a').text('Current Medications', 50, y);
  y += 25;

  if (!medications || medications.length === 0) {
    doc.fontSize(10).fillColor('#64748b').text('No medications recorded.', 50, y);
    y += 30;
  } else {
    medications.forEach((med, index) => {
      if (y > 720) {
        doc.addPage();
        y = 50;
      }

      doc.fontSize(11).fillColor('#0f172a').text(`${index + 1}. ${med.name}`, 50, y);
      y += 18;
      doc.fontSize(9).fillColor('#64748b');
      doc.text(`Dosage: ${med.dosage}`, 70, y);
      y += 15;
      doc.text(`Frequency: ${med.frequency}`, 70, y);
      if (med.startDate) {
        y += 15;
        doc.text(`Started: ${new Date(med.startDate).toLocaleDateString()}`, 70, y);
      }
      y += 25;
    });
  }

  doc.y = y;
}

// Helper: Add footer
function addFooter(doc) {
  const pageCount = doc.bufferedPageRange().count;

  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);

    const y = 750;
    doc.fontSize(8).fillColor('#94a3b8');
    doc.text(
      'This report is generated from HealthNexus and contains confidential health information.',
      50, y,
      { width: 495, align: 'center' }
    );
    doc.text(
      `Page ${i + 1} of ${pageCount}`,
      50, y + 15,
      { width: 495, align: 'center' }
    );
  }
}

module.exports = { generateHealthReport, generatePatientReport };

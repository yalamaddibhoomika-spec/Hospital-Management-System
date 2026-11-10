const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { createSuggestion, getPatientSuggestions, markAsRead } = require('../controllers/suggestionController');

router.post('/', protect, authorize('doctor'), createSuggestion);
router.get('/', protect, getPatientSuggestions);
router.put('/:id/read', protect, markAsRead);

module.exports = router;

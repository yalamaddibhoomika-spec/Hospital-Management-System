const express = require('express');
const { addHealthData, getHealthHistory } = require('../controllers/healthController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', protect, addHealthData);
router.get('/', protect, getHealthHistory);

module.exports = router;

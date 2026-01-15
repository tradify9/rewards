const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// Admin routes
router.get('/daily', protect, admin, reportController.generateDailyReport);
router.get('/daily/export', protect, admin, reportController.exportDailyReport);

module.exports = router;

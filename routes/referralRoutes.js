const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// User routes
router.post('/generate-code', protect, referralController.generateReferralCode);
router.get('/stats', protect, referralController.getReferralStats);

// Admin routes
router.get('/all', protect, admin, referralController.getAllReferrals);

module.exports = router;

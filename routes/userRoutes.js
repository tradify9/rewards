const express = require('express');
const router = express.Router();
const { getLeaderboard, updateBankDetails, getRewardHistory, getDashboard } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/leaderboard', protect, getLeaderboard);
router.put('/bank-details', protect, updateBankDetails);
router.get('/rewards', protect, getRewardHistory);
router.get('/dashboard', protect, getDashboard);

module.exports = router;

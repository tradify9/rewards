const express = require('express');
const router = express.Router();
const { getLeaderboard, updateBankDetails, getRewardHistory, getDashboard, transferCoins, getUserByUniqueId, payToUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/leaderboard', protect, getLeaderboard);
router.put('/bank-details', protect, updateBankDetails);
router.get('/rewards', protect, getRewardHistory);
router.get('/dashboard', protect, getDashboard);
router.post('/transfer-coins', protect, transferCoins);
router.get('/by-unique-id/:uniqueId', protect, getUserByUniqueId);
router.post('/pay-to-user', protect, payToUser);

module.exports = router;

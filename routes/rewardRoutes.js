const express = require('express');
const router = express.Router();
const { getRewards, getRewardStats } = require('../controllers/rewardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getRewards);
router.get('/stats', protect, getRewardStats);

module.exports = router;

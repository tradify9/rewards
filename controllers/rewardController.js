const RewardLog = require('../models/RewardLog');
const User = require('../models/User');

// @desc    Get all rewards for user
// @route   GET /api/rewards
// @access  Private
const getRewards = async (req, res) => {
  try {
    const rewards = await RewardLog.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json(rewards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get reward statistics
// @route   GET /api/rewards/stats
// @access  Private
const getRewardStats = async (req, res) => {
  try {
    const stats = await RewardLog.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$reason',
          totalCoins: { $sum: '$coinsEarned' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalCoins = await RewardLog.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: null, total: { $sum: '$coinsEarned' } } }
    ]);

    res.json({
      stats,
      totalCoinsEarned: totalCoins[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getRewards,
  getRewardStats
};

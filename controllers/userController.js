const User = require('../models/User');
const RewardLog = require('../models/RewardLog');

// @desc    Get leaderboard
// @route   GET /api/users/leaderboard
// @access  Private
const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await User.find({})
      .select('name email totalCoins tier loginCount')
      .sort({ totalCoins: -1, loginCount: -1 })
      .limit(50);

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user bank details
// @route   PUT /api/users/bank-details
// @access  Private
const updateBankDetails = async (req, res) => {
  try {
    const { accountHolderName, accountNumber, ifsc, bankName, upiId } = req.body;

    const user = await User.findById(req.user._id);

    user.bankDetails = {
      accountHolderName,
      accountNumber,
      ifsc,
      bankName,
      upiId
    };

    await user.save();

    res.json({ message: 'Bank details updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user reward history
// @route   GET /api/users/rewards
// @access  Private
const getRewardHistory = async (req, res) => {
  try {
    const rewards = await RewardLog.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(rewards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user dashboard data
// @route   GET /api/users/dashboard
// @access  Private
const getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    const totalEarned = await RewardLog.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: null, total: { $sum: '$coinsEarned' } } }
    ]);

    const recentRewards = await RewardLog.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    const pendingWithdrawals = await require('../models/Withdrawal').countDocuments({
      user: req.user._id,
      status: 'pending'
    });

    res.json({
      user,
      totalEarned: totalEarned[0]?.total || 0,
      recentRewards,
      pendingWithdrawals
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getLeaderboard,
  updateBankDetails,
  getRewardHistory,
  getDashboard
};

const User = require('../models/User');
const Withdrawal = require('../models/Withdrawal');
const RewardLog = require('../models/RewardLog');
const Service = require('../models/Service');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all withdrawals
// @route   GET /api/admin/withdrawals
// @access  Private/Admin
const getWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCoinsEarned = await RewardLog.aggregate([
      { $group: { _id: null, total: { $sum: '$coinsEarned' } } }
    ]);
    const totalWithdrawals = await Withdrawal.countDocuments();
    const pendingWithdrawals = await Withdrawal.countDocuments({ status: 'PENDING' });
    const totalServices = await Service.countDocuments({ status: 'active' });

    // Daily logins (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dailyLogins = await RewardLog.countDocuments({
      reason: 'login',
      createdAt: { $gte: oneDayAgo }
    });

    res.json({
      totalUsers,
      totalCoinsEarned: totalCoinsEarned[0]?.total || 0,
      totalWithdrawals,
      pendingWithdrawals,
      totalServices,
      dailyLogins
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user (Admin only)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (key !== 'password') { // Don't allow password update this way
        user[key] = updates[key];
      }
    });

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  getWithdrawals,
  getAnalytics,
  updateUser
};

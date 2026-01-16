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

// @desc    Transfer coins to another user
// @route   POST /api/users/transfer-coins
// @access  Private
const transferCoins = async (req, res) => {
  try {
    const { recipientId, amount } = req.body;

    if (!recipientId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid recipient or amount' });
    }

    const sender = await User.findById(req.user._id);
    const recipient = await User.findOne({ uniqueId: recipientId });

    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    if (sender._id.equals(recipient._id)) {
      return res.status(400).json({ message: 'Cannot transfer to yourself' });
    }

    if (sender.totalGold < amount) {
      return res.status(400).json({ message: 'Insufficient gold coins' });
    }

    sender.totalGold -= amount;
    recipient.totalGold += amount;

    await sender.save();
    await recipient.save();

    // Log the transfer
    await RewardLog.create({
      user: sender._id,
      coinsEarned: -amount,
      reason: 'transfer',
      tierAtTime: sender.tier
    });

    await RewardLog.create({
      user: recipient._id,
      coinsEarned: amount,
      reason: 'transfer',
      tierAtTime: recipient.tier
    });

    res.json({ message: 'Coins transferred successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by unique ID
// @route   GET /api/users/by-unique-id/:uniqueId
// @access  Private
const getUserByUniqueId = async (req, res) => {
  try {
    const { uniqueId } = req.params;

    const user = await User.findOne({ uniqueId }).select('name uniqueId tier totalCoins');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Pay coins to another user
// @route   POST /api/users/pay-to-user
// @access  Private
const payToUser = async (req, res) => {
  try {
    const { recipientId, amount, note } = req.body;

    if (!recipientId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid recipient or amount' });
    }

    const sender = await User.findById(req.user._id);
    const recipient = await User.findById(recipientId);

    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    if (sender._id.equals(recipient._id)) {
      return res.status(400).json({ message: 'Cannot pay to yourself' });
    }

    if (sender.totalGold < amount) {
      return res.status(400).json({ message: 'Insufficient gold coins' });
    }

    sender.totalGold -= amount;
    recipient.totalGold += amount;

    await sender.save();
    await recipient.save();

    // Log the payment
    await RewardLog.create({
      user: sender._id,
      coinsEarned: -amount,
      reason: `payment to ${recipient.name}`,
      tierAtTime: sender.tier
    });

    await RewardLog.create({
      user: recipient._id,
      coinsEarned: amount,
      reason: `payment from ${sender.name}`,
      tierAtTime: recipient.tier
    });

    res.json({ message: 'Payment successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getLeaderboard,
  updateBankDetails,
  getRewardHistory,
  getDashboard,
  transferCoins,
  getUserByUniqueId,
  payToUser
};

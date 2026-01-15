const User = require('../models/User');
const Referral = require('../models/Referral');
const RewardLog = require('../models/RewardLog');

// Generate referral code for user
const generateReferralCode = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.referralCode) {
      return res.status(400).json({ message: 'Referral code already exists', referralCode: user.referralCode });
    }

    // Generate unique referral code
    let referralCode;
    let exists = true;
    while (exists) {
      referralCode = 'REF' + Math.random().toString(36).substr(2, 6).toUpperCase();
      exists = await User.findOne({ referralCode });
    }

    user.referralCode = referralCode;
    await user.save();

    res.json({ message: 'Referral code generated successfully', referralCode });
  } catch (error) {
    console.error('Generate referral code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's referral stats
const getReferralStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate('referrals', 'name email createdAt');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const totalReferrals = user.referrals.length;
    const completedReferrals = await Referral.countDocuments({
      referrer: userId,
      status: 'completed'
    });

    const pendingReferrals = totalReferrals - completedReferrals;

    // Calculate total coins earned from referrals
    const referralRewards = await RewardLog.find({
      user: userId,
      reason: 'Referral Bonus'
    });

    const totalCoinsEarned = referralRewards.reduce((sum, reward) => sum + reward.coinsEarned, 0);

    res.json({
      referralCode: user.referralCode,
      totalReferrals,
      completedReferrals,
      pendingReferrals,
      totalCoinsEarned,
      referrals: user.referrals
    });
  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all referrals for admin
const getAllReferrals = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const referrals = await Referral.find()
      .populate('referrer', 'name email uniqueId')
      .populate('referred', 'name email uniqueId createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Referral.countDocuments();

    res.json({
      referrals,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalReferrals: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get all referrals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Process referral when user signs up with code
const processReferral = async (referralCode, newUserId) => {
  try {
    const referrer = await User.findOne({ referralCode });

    if (!referrer) {
      return; // Invalid referral code, continue without error
    }

    // Create referral record
    const referral = new Referral({
      referrer: referrer._id,
      referred: newUserId,
      referralCode,
      status: 'pending'
    });

    await referral.save();

    // Add to referrer's referrals array
    referrer.referrals.push(newUserId);
    await referrer.save();

    // Update new user's referredBy
    await User.findByIdAndUpdate(newUserId, { referredBy: referrer._id });

    // Check if referral should be completed (user has activated service)
    // This will be called after service activation

  } catch (error) {
    console.error('Process referral error:', error);
  }
};

// Complete referral when referred user activates service
const completeReferral = async (userId) => {
  try {
    const referral = await Referral.findOne({ referred: userId, status: 'pending' });

    if (!referral) {
      return;
    }

    referral.status = 'completed';
    referral.coinsEarned = 50; // Referral bonus
    await referral.save();

    // Give coins to referrer
    const referrer = await User.findById(referral.referrer);
    if (referrer) {
      referrer.totalCoins += 50;
      referrer.updateTier();
      await referrer.save();

      // Log the reward
      const rewardLog = new RewardLog({
        user: referrer._id,
        reason: 'Referral Bonus',
        coinsEarned: 50,
        tierAtTime: referrer.tier
      });
      await rewardLog.save();
    }
  } catch (error) {
    console.error('Complete referral error:', error);
  }
};

module.exports = {
  generateReferralCode,
  getReferralStats,
  getAllReferrals,
  processReferral,
  completeReferral
};

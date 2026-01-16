const mongoose = require('mongoose');
const User = require('../models/User');
const Referral = require('../models/Referral');
const RewardLog = require('../models/RewardLog');

/**
 * ===============================
 * Generate referral code for user
 * ===============================
 */const generateReferralCode = async (req, res) => {
  try {
    console.log('🔥 generateReferralCode HIT');

    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 🔴 IMPORTANT FIX START
    if (user.referralCode) {
      console.log('ℹ️ Existing referralCode:', user.referralCode);

      // 👉 CHECK: referral collection me entry hai ya nahi
      const existingReferral = await Referral.findOne({
        referrer: user._id,
        referralCode: user.referralCode
      });

      // 👉 AGAR NAHI HAI → CREATE KARO
      if (!existingReferral) {
        console.log('⚠️ Referral doc missing, creating now');

        await Referral.create({
          referrer: user._id,
          referralCode: user.referralCode,
          referred: null,
          status: 'pending'
        });

        console.log('✅ Referral doc CREATED for existing code');
      }

      return res.status(200).json({
        message: 'Referral code retrieved',
        referralCode: user.referralCode
      });
    }
    // 🔴 IMPORTANT FIX END

    // Generate unique code
    let referralCode;
    let exists = true;

    while (exists) {
      referralCode =
        'REF' + Math.random().toString(36).substring(2, 8).toUpperCase();
      exists = await Referral.exists({ referralCode });
    }

    user.referralCode = referralCode;
    await user.save();

    await Referral.create({
      referrer: user._id,
      referralCode,
      referred: null,
      status: 'pending'
    });

    console.log('✅ New referral created');

    return res.status(200).json({
      message: 'Referral code generated successfully',
      referralCode
    });

  } catch (error) {
    console.error('❌ Generate referral code error:', error);
    return res.status(500).json({ message: error.message });
  }
};


/**
 * ===============================
 * Get user's referral stats
 * ===============================
 */
const getReferralStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const referrals = await Referral.find({ referrer: userId })
      .populate('referred', 'name email createdAt serviceActivated')
      .sort({ createdAt: -1 });

    const completedReferrals = referrals.filter(r => r.status === 'completed').length;
    const pendingReferrals = referrals.filter(r => r.status === 'pending').length;

    const rewardLogs = await RewardLog.find({
      user: userId,
      reason: 'Referral Bonus'
    });

    const totalCoinsEarned = rewardLogs.reduce(
      (sum, r) => sum + r.coinsEarned,
      0
    );

    return res.status(200).json({
      referralCode: user.referralCode || null,
      totalReferrals: referrals.length,
      completedReferrals,
      pendingReferrals,
      totalCoinsEarned,
      referrals
    });

  } catch (error) {
    console.error('Get referral stats error:', error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * ===============================
 * Admin: Get all referrals
 * ===============================
 */
const getAllReferrals = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const referrals = await Referral.find()
      .populate('referrer', 'name email uniqueId')
      .populate('referred', 'name email uniqueId createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Referral.countDocuments();

    return res.status(200).json({
      referrals,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalReferrals: total
      }
    });

  } catch (error) {
    console.error('Get all referrals error:', error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * ===============================
 * Process referral on signup
 * ===============================
 */
const processReferral = async (referralCode, newUserId) => {
  try {
    if (!referralCode) return;

    const referral = await Referral.findOne({
      referralCode,
      referred: null
    });

    if (!referral) return;

    referral.referred = newUserId;
    referral.status = 'pending';
    await referral.save();

    await User.findByIdAndUpdate(newUserId, {
      referredBy: referral.referrer
    });

  } catch (error) {
    console.error('Process referral error:', error);
  }
};

/**
 * ===============================
 * Complete referral on activation
 * ===============================
 */
const completeReferral = async (userId) => {
  try {
    const referral = await Referral.findOne({
      referred: userId,
      status: 'pending'
    });

    if (!referral) return;

    referral.status = 'completed';
    referral.coinsEarned = 50;
    await referral.save();

    const referrer = await User.findById(referral.referrer);
    if (!referrer) return;

    referrer.totalCoins += 50;
    referrer.updateTier();
    await referrer.save();

    await RewardLog.create({
      user: referrer._id,
      reason: 'Referral Bonus',
      coinsEarned: 50,
      tierAtTime: referrer.tier
    });

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

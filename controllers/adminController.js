const User = require('../models/User');
const Withdrawal = require('../models/Withdrawal');
const RewardLog = require('../models/RewardLog');
const Service = require('../models/Service');
const { sendUserCredentialsEmail, sendCoinCertificateEmail } = require('../utils/sendMail');
const crypto = require('crypto');

// @desc    Get all users with pagination
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12; // Default 12 users per page
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalUsers = await User.countDocuments();

    const users = await User.find({})
      .select('-password')
      .populate('referredBy', 'name uniqueId')
      .populate('referrals', 'name uniqueId')
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    });
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

// @desc    Create new user (Admin only)
// @route   POST /api/admin/users
// @access  Private/Admin
const createUser = async (req, res) => {
  try {
    const { name, fatherName, email, phone, address, dob, gender, aadhaarNumber, panNumber } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Generate random password
    const password = crypto.randomBytes(8).toString('hex');

    // Create user
    const user = new User({
      name,
      fatherName,
      email,
      phone,
      address,
      dob,
      gender,
      aadhaarNumber,
      panNumber,
      password
    });

    await user.save();

    // Send email with credentials
    try {
      await sendUserCredentialsEmail(user, password);
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Don't fail the request if email fails
    }

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send coin certificate to user (Admin only)
// @route   POST /api/admin/users/:id/send-certificate
// @access  Private/Admin
const sendCoinCertificate = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send certificate email
    try {
      await sendCoinCertificateEmail(user);
      res.json({ message: 'Coin certificate sent successfully to user email' });
    } catch (emailError) {
      console.error('Failed to send certificate email:', emailError);
      res.status(500).json({ message: 'Failed to send certificate email' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  getWithdrawals,
  getAnalytics,
  updateUser,
  createUser,
  sendCoinCertificate
};

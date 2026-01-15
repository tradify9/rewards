const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const cloudinary = require('../config/cloudinary');
const razorpay = require('../config/razorpay');
const User = require('../models/User');
const RewardLog = require('../models/RewardLog');
const { calculateReward, updateUserTier } = require('../utils/rewardAlgorithm');
const { sendWelcomeEmail, sendResetEmail } = require('../utils/sendMail');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const { processReferral, completeReferral } = require('../controllers/referralController');

const register = async (req, res) => {
  try {
    const { name, email, phone, password, address, dob, gender, referralCode } = req.body;
    const files = req.files;

    // Validate input
    if (!name || !email || !phone || !password || !address) {
      return res.status(400).json({ message: 'All text fields are required' });
    }

    if (!files || !files.aadhaar || !files.aadhaar[0] || !files.pancard || !files.pancard[0] || !files.photo || !files.photo[0]) {
      return res.status(400).json({ message: 'All document files are required' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email: email.trim().toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Upload files to Cloudinary
    const uploadToCloudinary = (file, folder) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder, resource_type: 'auto' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        stream.end(file.buffer);
      });
    };

    const [aadhaarUrl, pancardUrl, photoUrl] = await Promise.all([
      uploadToCloudinary(files.aadhaar[0], 'user-docs/aadhaar'),
      uploadToCloudinary(files.pancard[0], 'user-docs/pancard'),
      uploadToCloudinary(files.photo[0], 'user-docs/photo')
    ]);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      address: address.trim(),
      dob: new Date(dob),
      gender,
      aadhaarUrl,
      pancardUrl,
      photoUrl
    });

    // Process referral if code provided
    if (referralCode) {
      await processReferral(referralCode, user._id);
    }

    // Send welcome email
    await sendWelcomeEmail(user);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      uniqueId: user.uniqueId,
      totalCoins: user.totalCoins,
      tier: user.tier,
      paymentRequired: true,
      amount: 100,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    let parsedBody = req.body;
    if (typeof parsedBody === 'string') {
      try {
        parsedBody = JSON.parse(parsedBody);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid JSON syntax' });
      }
    }
    const { email, password } = parsedBody;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if service is activated - allow login but redirect to payment
    const needsPayment = !user.serviceActivated;

    let rewardAmount = 0;
    try {
      // Calculate and award reward
      rewardAmount = await calculateReward(user);
      user.totalCoins += rewardAmount;
      user.loginCount += 1;
      user.lastLogin = new Date();

      // Update tier
      updateUserTier(user);

      await user.save();

      // Log the reward
      await RewardLog.create({
        user: user._id,
        coinsEarned: rewardAmount,
        reason: 'login',
        tierAtTime: user.tier,
        loginCount: user.loginCount
      });
    } catch (rewardError) {
      console.error('Reward calculation failed:', rewardError.message);
      // Still update login count and last login
      user.loginCount += 1;
      user.lastLogin = new Date();
      await user.save();
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      totalCoins: user.totalCoins,
      tier: user.tier,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
      rewardEarned: rewardAmount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // Send reset email
    await sendResetEmail(user, resetToken);

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create payment order
// @route   POST /api/auth/create-payment-order
// @access  Private
const createPaymentOrder = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.paymentStatus === 'completed') {
      return res.status(400).json({ message: 'Payment already completed' });
    }

    const options = {
      amount: 100 * 100, // 100 INR in paise
      currency: 'INR',
      receipt: `receipt_${user._id}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify payment
// @route   POST /api/auth/verify-payment
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSign) {
      user.paymentStatus = 'completed';
      user.serviceActivated = true;
      await user.save();

      // Complete referral if user was referred
      await completeReferral(user._id);

      res.json({ message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ message: 'Payment verification failed' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  forgotPassword,
  resetPassword,
  createPaymentOrder,
  verifyPayment
};

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const cloudinary = require('../config/cloudinary');
const razorpay = require('../config/razorpay');
const User = require('../models/User');
const UserDetails = require('../models/UserDetails');
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
    const { name, fatherName, email, phone, password, address, dob, gender, referralCode } = req.body;
    const files = req.files;

    // Validate input
    if (!name || !email || !phone || !password || !address) {
      return res.status(400).json({ message: 'All text fields are required' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email: email.trim().toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Upload files to Cloudinary if configured and files provided
    let aadhaarUrl = null;
    let pancardUrl = null;
    let photoUrl = null;

    if (process.env.CLOUDINARY_CLOUD_NAME && files) {
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

      try {
        const uploads = [];
        if (files.aadhaar && files.aadhaar[0]) uploads.push(uploadToCloudinary(files.aadhaar[0], 'user-docs/aadhaar'));
        if (files.pancard && files.pancard[0]) uploads.push(uploadToCloudinary(files.pancard[0], 'user-docs/pancard'));
        if (files.photo && files.photo[0]) uploads.push(uploadToCloudinary(files.photo[0], 'user-docs/photo'));

        const results = await Promise.all(uploads);
        aadhaarUrl = results[0] || null;
        pancardUrl = results[1] || null;
        photoUrl = results[2] || null;
      } catch (uploadError) {
        console.error('File upload failed:', uploadError.message);
        // Continue with null URLs
      }
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      fatherName: fatherName ? fatherName.trim() : '',
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

    // Create user details
    await UserDetails.create({
      user: user._id,
      dateOfBirth: new Date(dob),
      gender
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
    const today = new Date();
    const lastLoginDate = user.lastLogin ? new Date(user.lastLogin) : null;

    // Check if user already logged in today
    const hasLoggedInToday = lastLoginDate &&
      lastLoginDate.getDate() === today.getDate() &&
      lastLoginDate.getMonth() === today.getMonth() &&
      lastLoginDate.getFullYear() === today.getFullYear();

    try {
      if (!hasLoggedInToday) {
        // Calculate and award reward only if not logged in today
        rewardAmount = await calculateReward(user);
        user.totalCoins += rewardAmount;

        // Log the reward
        await RewardLog.create({
          user: user._id,
          coinsEarned: rewardAmount,
          reason: 'login',
          tierAtTime: user.tier,
          loginCount: user.loginCount + 1
        });
      }

      user.loginCount += 1;
      user.lastLogin = new Date();

      // Update tier
      updateUserTier(user);

      await user.save();
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
    const { amount } = req.body;
    console.log('Creating payment order for amount:', amount);

    // Validate amount
    if (!amount || amount <= 0) {
      console.log('Invalid amount:', amount);
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      console.log('User not found for payment order');
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.paymentStatus === 'completed') {
      console.log('Payment already completed for user:', user._id);
      return res.status(400).json({ message: 'Payment already completed' });
    }

    const amountInPaise = Math.round(amount * 100); // Convert to paise and round
    console.log('Amount in paise:', amountInPaise);

    // Generate short receipt ID (max 40 chars)
    const shortId = user._id.toString().slice(-8);
    const timestamp = Date.now().toString().slice(-6);
    const receipt = `rcpt_${shortId}_${timestamp}`;

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: receipt,
      payment_capture: 1
    };

    console.log('Razorpay order options:', options);

    // Check if Razorpay is properly configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay keys not configured');
      return res.status(500).json({ message: 'Payment service not configured. Please contact support.' });
    }

    const order = await razorpay.orders.create(options);
    console.log('Razorpay order created:', order.id);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('Error creating payment order:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ message: 'Failed to create payment order. Please try again.' });
  }
};

// @desc    Verify payment
// @route   POST /api/auth/verify-payment
// @access  Private
const Transaction = require('../models/Transaction');

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

      // Create transaction record for payment
      await Transaction.create({
        user: user._id,
        apiResponse: {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature
        },
        status: 'SUCCESS',
        amount: 100,
        currency: 'INR'
      });

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

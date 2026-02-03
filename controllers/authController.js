const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const cloudinary = require('../config/cloudinary');
const razorpay = require('../config/razorpay');

const User = require('../models/User');
const UserDetails = require('../models/UserDetails');
const RewardLog = require('../models/RewardLog');
const Transaction = require('../models/Transaction');

const { calculateReward, updateUserTier } = require('../utils/rewardAlgorithm');
const { sendWelcomeEmail, sendResetEmail } = require('../utils/sendMail');
const { logUserActivity } = require('../utils/activityLogger');

const { processReferral, completeReferral } = require('../controllers/referralController');


// 🔹 Generate JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || "secret123",
    { expiresIn: '30d' }
  );
};


// ================= REGISTER =================

const register = async (req, res) => {
  try {
    const { name, fatherName, email, phone, password, dob, gender, referralCode } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'All required fields are required' });
    }

    const userExists = await User.findOne({ email: email.trim().toLowerCase() });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name: name.trim(),
      fatherName: fatherName ? fatherName.trim() : '',
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      dob: dob ? new Date(dob) : null,
      gender
    });

    await UserDetails.create({
      user: user._id,
      dateOfBirth: dob ? new Date(dob) : null,
      gender
    });

    if (referralCode) {
      await processReferral(referralCode, user._id);
    }

    try {
      await sendWelcomeEmail(user);
    } catch (mailError) {
      console.error("Welcome email failed:", mailError.message);
    }

    try {
      await logUserActivity.signup(user, req);
    } catch {}

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
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};


// ================= LOGIN =================

const login = async (req, res) => {
  try {
    console.log("LOGIN BODY:", req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!user.password) {
      return res.status(500).json({ message: "User password missing in DB" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    user.loginCount += 1;
    user.lastLogin = new Date();
    updateUserTier(user);

    await user.save();

    try {
      await logUserActivity.login(user, req);
    } catch {}

    const token = generateToken(user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      totalCoins: user.totalCoins,
      tier: user.tier,
      isAdmin: user.isAdmin,
      token
    });

  } catch (error) {
    console.error("🔥 LOGIN CRASH:", error);
    res.status(500).json({ message: error.message });
  }
};


// ================= PROFILE =================

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= FORGOT PASSWORD =================

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    user.resetPasswordToken = crypto.createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    await sendResetEmail(user, resetToken);

    res.json({ message: 'Password reset email sent' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= RESET PASSWORD =================

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const resetPasswordToken = crypto.createHash('sha256')
      .update(token)
      .digest('hex');

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

    try {
      await logUserActivity.passwordChange(user, req);
    } catch {}

    res.json({ message: 'Password reset successful' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= PAYMENT ORDER =================

const createPaymentOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: 'Payment service not configured' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });

  } catch (error) {
    console.error("Payment order error:", error);
    res.status(500).json({ message: 'Failed to create payment order' });
  }
};


// ================= VERIFY PAYMENT =================

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const sign = razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    user.paymentStatus = 'completed';
    user.serviceActivated = true;

    const coinsToAdd = Math.floor(amount / 10);
    user.totalCoins += coinsToAdd;

    updateUserTier(user);
    await user.save();

    await RewardLog.create({
      user: user._id,
      coinsEarned: coinsToAdd,
      reason: 'Payment Reward',
      tierAtTime: user.tier
    });

    await Transaction.create({
      user: user._id,
      status: 'SUCCESS',
      amount,
      currency: 'INR'
    });

    await completeReferral(user._id);

    res.json({ message: 'Payment verified successfully' });

  } catch (error) {
    console.error("Verify payment error:", error);
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

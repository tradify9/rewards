const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  fatherName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  address: {
    type: String,
    trim: true
  },
  dob: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },

  // Document numbers
  aadhaarNumber: {
    type: String,
    trim: true
  },
  panNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  photoUrl: String,

  // Auto-generate unique user ID
  uniqueId: {
    type: String,
    unique: true
  },

  totalCoins: {
    type: Number,
    default: 0
  },
  totalGold: {
    type: Number,
    default: 0
  },

  // Tier system
  tier: {
    type: String,
    enum: ['Silver', 'Gold', 'Platinum'],
    default: 'Silver'
  },

  // Bank details for withdrawals
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    ifsc: String,
    bankName: String,
    upiId: String
  },

  paymentStatus: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },

  serviceActivated: {
    type: Boolean,
    default: false
  },

  kycStatus: {
    type: String,
    enum: ['not_submitted', 'pending', 'verified', 'rejected'],
    default: 'not_submitted'
  },

  isAdmin: {
    type: Boolean,
    default: false
  },

  blocked: {
    type: Boolean,
    default: false
  },

  lastLogin: Date,
  loginCount: {
    type: Number,
    default: 0
  },

  resetPasswordToken: String,
  resetPasswordExpires: Date,

  // ⭐ FIXED FIELD
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },

  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  referrals: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ]
}, {
  timestamps: true
});

// Auto-generate unique User ID (ATC001, ATC002, etc.) and Referral Code
userSchema.pre('save', async function (next) {
  if (!this.uniqueId) {
    // Find the highest ATC number
    const lastUser = await mongoose.models.User.findOne({ uniqueId: /^ATC\d+$/ }).sort({ uniqueId: -1 });
    let nextNumber = 1;

    if (lastUser) {
      const lastNumber = parseInt(lastUser.uniqueId.replace('ATC', ''));
      nextNumber = lastNumber + 1;
    }

    this.uniqueId = `ATC${nextNumber.toString().padStart(3, '0')}`;
  }

  if (!this.referralCode) {
    // Referral code is the same as uniqueId
    this.referralCode = this.uniqueId;
  }

  // Password hashing only when modified
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update tier based on coins
userSchema.methods.updateTier = function () {
  if (this.totalCoins >= 5000) {
    this.tier = 'Platinum';
  } else if (this.totalCoins >= 1000) {
    this.tier = 'Gold';
  } else {
    this.tier = 'Silver';
  }
};

module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
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
  aadhaarUrl: {
    type: String
  },
  pancardUrl: {
    type: String
  },
  photoUrl: {
    type: String
  },
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
  tier: {
    type: String,
    enum: ['Silver', 'Gold', 'Platinum'],
    default: 'Silver'
  },
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
  isAdmin: {
    type: Boolean,
    default: false
  },
  blocked: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },
  loginCount: {
    type: Number,
    default: 0
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  referralCode: {
    type: String,
    unique: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  referrals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Generate uniqueId before saving
userSchema.pre('save', async function(next) {
  if (!this.uniqueId) {
    let uniqueId;
    let exists = true;
    while (exists) {
      uniqueId = 'USR' + Math.random().toString(36).substr(2, 9).toUpperCase();
      exists = await mongoose.models.User.findOne({ uniqueId });
    }
    this.uniqueId = uniqueId;
  }

  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update tier based on totalCoins
userSchema.methods.updateTier = function() {
  if (this.totalCoins >= 5000) {
    this.tier = 'Platinum';
  } else if (this.totalCoins >= 1000) {
    this.tier = 'Gold';
  } else {
    this.tier = 'Silver';
  }
};

module.exports = mongoose.model('User', userSchema);

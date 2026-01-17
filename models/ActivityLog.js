const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'signup',
      'profile_update',
      'password_change',
      'kyc_submit',
      'kyc_approve',
      'kyc_reject',
      'withdrawal_request',
      'withdrawal_approve',
      'withdrawal_reject',
      'payment_made',
      'payment_received',
      'service_redeemed',
      'referral_earned',
      'qr_scan',
      'transfer_sent',
      'transfer_received',
      'reward_earned',
      'admin_action'
    ]
  },
  description: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  location: {
    ip: String,
    country: String,
    region: String,
    city: String,
    latitude: Number,
    longitude: Number,
    timezone: String,
    isp: String
  },
  device: {
    userAgent: String,
    browser: String,
    os: String,
    device: String,
    platform: String
  },
  sessionId: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  }
});

// Index for efficient queries
activityLogSchema.index({ user: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });
activityLogSchema.index({ timestamp: -1 });
activityLogSchema.index({ 'location.ip': 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);

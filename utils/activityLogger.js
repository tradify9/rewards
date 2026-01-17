const ActivityLog = require('../models/ActivityLog');
const axios = require('axios');

// Function to get location data from IP
const getLocationFromIP = async (ip) => {
  try {
    // Using ipapi.co for free IP geolocation (no API key required for basic usage)
    const response = await axios.get(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon,timezone,isp,query`, {
      timeout: 5000
    });

    if (response.data.status === 'success') {
      return {
        ip: response.data.query,
        country: response.data.country,
        region: response.data.regionName,
        city: response.data.city,
        latitude: response.data.lat,
        longitude: response.data.lon,
        timezone: response.data.timezone,
        isp: response.data.isp
      };
    }
  } catch (error) {
    console.error('Error fetching location data:', error.message);
  }

  return {
    ip: ip,
    country: 'Unknown',
    region: 'Unknown',
    city: 'Unknown',
    latitude: null,
    longitude: null,
    timezone: 'Unknown',
    isp: 'Unknown'
  };
};

// Function to parse user agent string
const parseUserAgent = (userAgent) => {
  const ua = userAgent || '';

  // Simple user agent parsing
  let browser = 'Unknown';
  let os = 'Unknown';
  let device = 'Unknown';

  // Browser detection
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Opera')) browser = 'Opera';

  // OS detection
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  // Device detection
  if (ua.includes('Mobile')) device = 'Mobile';
  else if (ua.includes('Tablet')) device = 'Tablet';
  else device = 'Desktop';

  return {
    userAgent: ua,
    browser,
    os,
    device,
    platform: os
  };
};

// Main logging function
const logActivity = async ({
  user,
  action,
  description,
  details = {},
  req,
  severity = 'low'
}) => {
  try {
    let location = {};
    let device = {};

    if (req) {
      // Get IP address
      const ip = req.ip ||
                 req.connection.remoteAddress ||
                 req.socket.remoteAddress ||
                 (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                 '127.0.0.1';

      // Clean IP (remove IPv6 prefix if present)
      const cleanIP = ip.replace(/^::ffff:/, '');

      // Get location data
      location = await getLocationFromIP(cleanIP);

      // Parse device info
      device = parseUserAgent(req.get('User-Agent'));
    }

    // Create activity log
    const activityLog = new ActivityLog({
      user,
      action,
      description,
      details,
      location,
      device,
      sessionId: req?.session?.id || null,
      severity
    });

    await activityLog.save();

    console.log(`Activity logged: ${action} - ${description}`);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// Helper functions for common activities
const logUserActivity = {
  login: (user, req) => logActivity({
    user: user._id,
    action: 'login',
    description: `${user.name} logged into their account`,
    details: { email: user.email },
    req,
    severity: 'low'
  }),

  logout: (user, req) => logActivity({
    user: user._id,
    action: 'logout',
    description: `${user.name} logged out of their account`,
    req,
    severity: 'low'
  }),

  signup: (user, req) => logActivity({
    user: user._id,
    action: 'signup',
    description: `${user.name} created a new account`,
    details: { email: user.email },
    req,
    severity: 'medium'
  }),

  profileUpdate: (user, req, changes) => logActivity({
    user: user._id,
    action: 'profile_update',
    description: `${user.name} updated their profile`,
    details: changes,
    req,
    severity: 'low'
  }),

  passwordChange: (user, req) => logActivity({
    user: user._id,
    action: 'password_change',
    description: `${user.name} changed their password`,
    req,
    severity: 'medium'
  }),

  kycSubmit: (user, req) => logActivity({
    user: user._id,
    action: 'kyc_submit',
    description: `${user.name} submitted KYC documents`,
    req,
    severity: 'high'
  }),

  kycApprove: (admin, user, req) => logActivity({
    user: admin._id,
    action: 'kyc_approve',
    description: `Admin ${admin.name} approved KYC for ${user.name}`,
    details: { targetUser: user._id, targetUserName: user.name },
    req,
    severity: 'high'
  }),

  kycReject: (admin, user, req, reason) => logActivity({
    user: admin._id,
    action: 'kyc_reject',
    description: `Admin ${admin.name} rejected KYC for ${user.name}`,
    details: { targetUser: user._id, targetUserName: user.name, reason },
    req,
    severity: 'high'
  }),

  withdrawalRequest: (user, req, amount) => logActivity({
    user: user._id,
    action: 'withdrawal_request',
    description: `${user.name} requested withdrawal of ${amount} coins`,
    details: { amount },
    req,
    severity: 'high'
  }),

  withdrawalApprove: (admin, user, req, amount) => logActivity({
    user: admin._id,
    action: 'withdrawal_approve',
    description: `Admin ${admin.name} approved withdrawal of ${amount} coins for ${user.name}`,
    details: { targetUser: user._id, targetUserName: user.name, amount },
    req,
    severity: 'high'
  }),

  withdrawalReject: (admin, user, req, amount, reason) => logActivity({
    user: admin._id,
    action: 'withdrawal_reject',
    description: `Admin ${admin.name} rejected withdrawal of ${amount} coins for ${user.name}`,
    details: { targetUser: user._id, targetUserName: user.name, amount, reason },
    req,
    severity: 'high'
  }),

  paymentMade: (sender, receiver, req, amount, note) => logActivity({
    user: sender._id,
    action: 'payment_made',
    description: `${sender.name} sent ${amount} coins to ${receiver.name}`,
    details: { receiver: receiver._id, receiverName: receiver.name, amount, note },
    req,
    severity: 'medium'
  }),

  paymentReceived: (receiver, sender, req, amount) => logActivity({
    user: receiver._id,
    action: 'payment_received',
    description: `${receiver.name} received ${amount} coins from ${sender.name}`,
    details: { sender: sender._id, senderName: sender.name, amount },
    req,
    severity: 'medium'
  }),

  serviceRedeemed: (user, req, serviceName, cost) => logActivity({
    user: user._id,
    action: 'service_redeemed',
    description: `${user.name} redeemed service: ${serviceName} for ${cost} coins`,
    details: { serviceName, cost },
    req,
    severity: 'medium'
  }),

  referralEarned: (user, req, referredUser, amount) => logActivity({
    user: user._id,
    action: 'referral_earned',
    description: `${user.name} earned ${amount} coins from referral: ${referredUser.name}`,
    details: { referredUser: referredUser._id, referredUserName: referredUser.name, amount },
    req,
    severity: 'medium'
  }),

  qrScan: (user, req, scannedUser) => logActivity({
    user: user._id,
    action: 'qr_scan',
    description: `${user.name} scanned QR code of ${scannedUser.name}`,
    details: { scannedUser: scannedUser._id, scannedUserName: scannedUser.name },
    req,
    severity: 'low'
  }),

  transferSent: (sender, receiver, req, amount) => logActivity({
    user: sender._id,
    action: 'transfer_sent',
    description: `${sender.name} transferred ${amount} coins to ${receiver.name}`,
    details: { receiver: receiver._id, receiverName: receiver.name, amount },
    req,
    severity: 'medium'
  }),

  transferReceived: (receiver, sender, req, amount) => logActivity({
    user: receiver._id,
    action: 'transfer_received',
    description: `${receiver.name} received ${amount} coins from ${sender.name}`,
    details: { sender: sender._id, senderName: sender.name, amount },
    req,
    severity: 'medium'
  }),

  rewardEarned: (user, req, reason, amount) => logActivity({
    user: user._id,
    action: 'reward_earned',
    description: `${user.name} earned ${amount} coins: ${reason}`,
    details: { reason, amount },
    req,
    severity: 'low'
  }),

  adminAction: (admin, req, action, details) => logActivity({
    user: admin._id,
    action: 'admin_action',
    description: `Admin ${admin.name} performed: ${action}`,
    details,
    req,
    severity: 'high'
  })
};

module.exports = {
  logActivity,
  logUserActivity
};

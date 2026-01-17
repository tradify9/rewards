const RewardLog = require('../models/RewardLog');

// Reward algorithm - made difficult to earn coins
const calculateReward = async (user) => {
  // Base reward: random 1-2 coins (made very difficult)
  const baseReward = Math.floor(Math.random() * 2) + 1; // 1 to 2

  // No streak bonus anymore
  // No tier bonus anymore

  return baseReward;
};

// Update user tier based on total coins
const updateUserTier = (user) => {
  if (user.totalCoins >= 5000) {
    user.tier = 'Platinum';
  } else if (user.totalCoins >= 1000) {
    user.tier = 'Gold';
  } else {
    user.tier = 'Silver';
  }
};

module.exports = {
  calculateReward,
  updateUserTier
};

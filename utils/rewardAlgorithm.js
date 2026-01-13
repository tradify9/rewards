const RewardLog = require('../models/RewardLog');

// Reward algorithm - Paytm style random login rewards
const calculateReward = async (user) => {
  // Give random 1-4 coins on login (like Paytm)
  const randomReward = Math.floor(Math.random() * 4) + 1; // 1, 2, 3, or 4

  return randomReward;
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

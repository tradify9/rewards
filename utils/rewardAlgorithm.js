const RewardLog = require('../models/RewardLog');

// Reward algorithm - random login rewards up to 10
const calculateReward = async (user) => {
  // Give random 1-10 coins on login
  const randomReward = Math.floor(Math.random() * 10) + 1; // 1 to 10

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

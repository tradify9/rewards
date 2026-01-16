const RewardLog = require('../models/RewardLog');

// Reward algorithm - improved to make earning easier
const calculateReward = async (user) => {
  // Base reward: random 5-20 coins (increased from 1-10)
  const baseReward = Math.floor(Math.random() * 16) + 5; // 5 to 20

  // Streak bonus: if logged in consecutively, add bonus
  let streakBonus = 0;
  const now = new Date();
  const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;

  if (lastLogin) {
    const daysDiff = Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24));
    if (daysDiff === 1) {
      // Consecutive day
      streakBonus = Math.floor(baseReward * 0.5); // 50% bonus
    }
  }

  // Tier bonus: higher tiers get more
  let tierBonus = 0;
  if (user.tier === 'Gold') {
    tierBonus = 5;
  } else if (user.tier === 'Platinum') {
    tierBonus = 10;
  }

  const totalReward = baseReward + streakBonus + tierBonus;

  return totalReward;
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

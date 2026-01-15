const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Withdrawal = require('../models/Withdrawal');
const RewardLog = require('../models/RewardLog');
const Referral = require('../models/Referral');

// Generate daily report
const generateDailyReport = async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date ? new Date(date) : new Date();

    // Set date range for the day
    const startOfDay = new Date(reportDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all data for the day
    const [
      newUsers,
      transactions,
      withdrawals,
      rewards,
      referrals
    ] = await Promise.all([
      User.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }).select('name email phone uniqueId createdAt'),

      Transaction.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }).populate('user', 'name email uniqueId'),

      Withdrawal.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }).populate('user', 'name email uniqueId'),

      RewardLog.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }).populate('user', 'name email uniqueId'),

      Referral.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }).populate('referrer', 'name email uniqueId')
      .populate('referred', 'name email uniqueId')
    ]);

    // Calculate summary statistics
    const summary = {
      date: reportDate.toISOString().split('T')[0],
      newUsersCount: newUsers.length,
      transactionsCount: transactions.length,
      withdrawalsCount: withdrawals.length,
      rewardsCount: rewards.length,
      referralsCount: referrals.length,
      totalCoinsEarned: rewards.reduce((sum, reward) => sum + reward.coinsEarned, 0),
      totalCoinsWithdrawn: withdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0),
      totalReferralBonus: referrals.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.coinsEarned, 0)
    };

    // Prepare CSV data
    const csvData = {
      summary,
      newUsers,
      transactions,
      withdrawals,
      rewards,
      referrals
    };

    res.json(csvData);
  } catch (error) {
    console.error('Generate daily report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Export daily report as CSV
const exportDailyReport = async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date ? new Date(date) : new Date();

    // Set date range for the day
    const startOfDay = new Date(reportDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all data for the day
    const [
      newUsers,
      transactions,
      withdrawals,
      rewards,
      referrals
    ] = await Promise.all([
      User.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }).select('name email phone uniqueId createdAt'),

      Transaction.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }).populate('user', 'name email uniqueId'),

      Withdrawal.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }).populate('user', 'name email uniqueId'),

      RewardLog.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }).populate('user', 'name email uniqueId'),

      Referral.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }).populate('referrer', 'name email uniqueId')
      .populate('referred', 'name email uniqueId')
    ]);

    // Create CSV content
    let csvContent = 'Daily Report - ' + reportDate.toISOString().split('T')[0] + '\n\n';

    // Summary
    csvContent += 'SUMMARY\n';
    csvContent += `Date,${reportDate.toISOString().split('T')[0]}\n`;
    csvContent += `New Users,${newUsers.length}\n`;
    csvContent += `Transactions,${transactions.length}\n`;
    csvContent += `Withdrawals,${withdrawals.length}\n`;
    csvContent += `Rewards,${rewards.length}\n`;
    csvContent += `Referrals,${referrals.length}\n`;
    csvContent += `Total Coins Earned,${rewards.reduce((sum, reward) => sum + reward.coinsEarned, 0)}\n`;
    csvContent += `Total Coins Withdrawn,${withdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0)}\n`;
    csvContent += `Total Referral Bonus,${referrals.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.coinsEarned, 0)}\n\n`;

    // New Users
    csvContent += 'NEW USERS\n';
    csvContent += 'Name,Email,Phone,Unique ID,Registration Date\n';
    newUsers.forEach(user => {
      csvContent += `${user.name},${user.email},${user.phone},${user.uniqueId},${user.createdAt.toISOString()}\n`;
    });
    csvContent += '\n';

    // Transactions
    csvContent += 'TRANSACTIONS\n';
    csvContent += 'User Name,User Email,User ID,Type,Amount,Status,Date\n';
    transactions.forEach(tx => {
      csvContent += `${tx.user?.name || 'N/A'},${tx.user?.email || 'N/A'},${tx.user?.uniqueId || 'N/A'},${tx.type},${tx.amount},${tx.status},${tx.createdAt.toISOString()}\n`;
    });
    csvContent += '\n';

    // Withdrawals
    csvContent += 'WITHDRAWALS\n';
    csvContent += 'User Name,User Email,User ID,Amount,Status,Date\n';
    withdrawals.forEach(w => {
      csvContent += `${w.user?.name || 'N/A'},${w.user?.email || 'N/A'},${w.user?.uniqueId || 'N/A'},${w.amount},${w.status},${w.createdAt.toISOString()}\n`;
    });
    csvContent += '\n';

    // Rewards
    csvContent += 'REWARDS\n';
    csvContent += 'User Name,User Email,User ID,Reason,Coins Earned,Tier,Date\n';
    rewards.forEach(r => {
      csvContent += `${r.user?.name || 'N/A'},${r.user?.email || 'N/A'},${r.user?.uniqueId || 'N/A'},${r.reason},${r.coinsEarned},${r.tierAtTime},${r.createdAt.toISOString()}\n`;
    });
    csvContent += '\n';

    // Referrals
    csvContent += 'REFERRALS\n';
    csvContent += 'Referrer Name,Referrer Email,Referrer ID,Referred Name,Referred Email,Referred ID,Status,Coins Earned,Date\n';
    referrals.forEach(r => {
      csvContent += `${r.referrer?.name || 'N/A'},${r.referrer?.email || 'N/A'},${r.referrer?.uniqueId || 'N/A'},${r.referred?.name || 'N/A'},${r.referred?.email || 'N/A'},${r.referred?.uniqueId || 'N/A'},${r.status},${r.coinsEarned},${r.createdAt.toISOString()}\n`;
    });

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=daily-report-${reportDate.toISOString().split('T')[0]}.csv`);

    res.send(csvContent);
  } catch (error) {
    console.error('Export daily report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  generateDailyReport,
  exportDailyReport
};

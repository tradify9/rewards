const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const Transaction = require('../models/Transaction');  // ⭐ ADD THIS
const { processPayout } = require('../utils/payout');
const { sendWithdrawalSuccessEmail, sendWithdrawalFailedEmail } = require('../utils/sendMail');

// ⭐ Create withdrawal request (User)
const createWithdrawal = async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.user._id);

    if (amount < 500) {
      return res.status(400).json({ message: 'Minimum withdrawal amount is 500 coins' });
    }

    if (user.totalCoins < amount) {
      return res.status(400).json({ message: 'Insufficient coins' });
    }

    if (!user.bankDetails || !user.bankDetails.accountNumber) {
      return res.status(400).json({ message: 'Bank details required for withdrawal' });
    }

    // Deduct coins
    user.totalCoins -= amount;
    await user.save();

    // Create Withdrawal
    const withdrawal = await Withdrawal.create({
      user: user._id,
      amount,
      status: 'PENDING',
      bankDetails: user.bankDetails
    });

    return res.status(201).json({
      message: 'Withdrawal request created successfully',
      withdrawal
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ⭐ User can view their withdrawals
const getWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.json(withdrawals);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ⭐ Admin approves withdrawal
const approveWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'PENDING') {
      return res.status(400).json({ message: 'Withdrawal already processed' });
    }

    // First approve
    withdrawal.status = 'APPROVED';
    await withdrawal.save();

    // Process Payout
    const payoutResult = await processPayout(withdrawal);

    const user = await User.findById(withdrawal.user);

    // ⭐ SUCCESS FLOW
    if (payoutResult.success) {
      withdrawal.status = 'SUCCESS';
      withdrawal.razorpayPayoutId = payoutResult.payoutId;
      withdrawal.transactionId = payoutResult.payout.id;
      await withdrawal.save();

      // ⭐ CREATE TRANSACTION ENTRY
      await Transaction.create({
        withdrawal: withdrawal._id,
        user: user._id,
        apiResponse: payoutResult,
        status: 'SUCCESS',
        amount: withdrawal.amount,
        currency: 'INR',
        payoutId: payoutResult.payoutId
      });

      await sendWithdrawalSuccessEmail(user, withdrawal);

      return res.json({
        message: 'Withdrawal processed successfully',
        withdrawal
      });
    }

    // ⭐ FAILED FLOW
    withdrawal.status = 'FAILED';
    withdrawal.notes = payoutResult.error;
    await withdrawal.save();

    // Refund coins
    user.totalCoins += withdrawal.amount;
    await user.save();

    // ⭐ CREATE FAILED TRANSACTION ENTRY
    await Transaction.create({
      withdrawal: withdrawal._id,
      user: user._id,
      apiResponse: payoutResult,
      status: 'FAILED',
      amount: withdrawal.amount,
      currency: 'INR',
      errorMessage: payoutResult.error
    });

    await sendWithdrawalFailedEmail(user, withdrawal, payoutResult.error);

    return res.status(500).json({
      message: 'Payout failed',
      error: payoutResult.error
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createWithdrawal,
  getWithdrawals,
  approveWithdrawal
};

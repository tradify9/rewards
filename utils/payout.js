const razorpay = require('../config/razorpay');
const Transaction = require('../models/Transaction');
const winston = require('winston');

// Logger setup
const payoutLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/payout.log' }),
    new winston.transports.Console()
  ]
});

const errorLogger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log' }),
    new winston.transports.Console()
  ]
});

// Process payout using Razorpay
const processPayout = async (withdrawal) => {
  try {
    // Convert coins to rupees (assuming 1 coin = 1 rupee for simplicity)
    const amountInRupees = withdrawal.amount * 100; // Razorpay expects amount in paisa

    const payoutData = {
      account_number: withdrawal.bankDetails.accountNumber,
      fund_account: {
        account_type: 'bank_account',
        bank_account: {
          name: withdrawal.bankDetails.accountHolderName,
          ifsc: withdrawal.bankDetails.ifsc,
          account_number: withdrawal.bankDetails.accountNumber
        }
      },
      amount: amountInRupees,
      currency: 'INR',
      mode: 'IMPS',
      purpose: 'payout',
      queue_if_low_balance: true,
      reference_id: `withdrawal_${withdrawal._id}`,
      narration: 'Reward withdrawal payout'
    };

    const payout = await razorpay.payouts.create(payoutData);

    // Log successful payout
    payoutLogger.info('Payout initiated', {
      withdrawalId: withdrawal._id,
      payoutId: payout.id,
      amount: withdrawal.amount
    });

    // Create transaction record
    await Transaction.create({
      withdrawal: withdrawal._id,
      apiResponse: payout,
      status: 'SUCCESS',
      amount: withdrawal.amount,
      payoutId: payout.id
    });

    return { success: true, payoutId: payout.id, payout };

  } catch (error) {
    // Log error
    errorLogger.error('Payout failed', {
      withdrawalId: withdrawal._id,
      error: error.message,
      stack: error.stack
    });

    // Create transaction record for failed payout
    await Transaction.create({
      withdrawal: withdrawal._id,
      apiResponse: error,
      status: 'FAILED',
      amount: withdrawal.amount,
      errorMessage: error.message
    });

    return { success: false, error: error.message };
  }
};

module.exports = {
  processPayout
};

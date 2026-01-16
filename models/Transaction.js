const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    withdrawal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Withdrawal'
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    apiResponse: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    payoutId: {
      type: String
    },
    errorMessage: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Transaction', transactionSchema);

const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'SUCCESS', 'FAILED'],
    default: 'PENDING'
  },
  bankDetails: {
    accountHolderName: {
      type: String,
      required: true
    },
    accountNumber: {
      type: String,
      required: true
    },
    ifsc: {
      type: String,
      required: true
    },
    bankName: {
      type: String,
      required: true
    },
    upiId: String
  },
  transactionId: {
    type: String
  },
  razorpayPayoutId: {
    type: String
  },
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Withdrawal', withdrawalSchema);

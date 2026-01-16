const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    referred: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    referralCode: {
      type: String,
      required: true,
      unique: true
    },

    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending"
    },

    coinsEarned: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Referral", referralSchema);

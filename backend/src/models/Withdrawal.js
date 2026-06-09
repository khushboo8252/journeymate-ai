const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [1, "Amount must be at least ₹1"],
    },
    withdrawalMethod: {
      type: String,
      enum: ["bank", "cash"],
      required: [true, "Withdrawal method is required"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "paid"],
      default: "pending",
    },
    // Bank transfer details
    bankAccountNumber: {
      type: String,
      default: null,
    },
    ifscCode: {
      type: String,
      default: null,
    },
    accountHolderName: {
      type: String,
      default: null,
    },
    // Cash withdrawal specific
    notes: {
      type: String,
      default: null,
    },
    // Rejection reason
    rejectionReason: {
      type: String,
      default: null,
    },
    // Processing details
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    // Transaction reference
    transactionReference: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for faster queries
withdrawalSchema.index({ driverId: 1, status: 1 });
withdrawalSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Withdrawal", withdrawalSchema);

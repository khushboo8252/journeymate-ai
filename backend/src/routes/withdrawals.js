const express = require("express");
const { body, validationResult } = require("express-validator");
const Withdrawal = require("../models/Withdrawal");
const User = require("../models/User");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

// GET /api/withdrawals — Get driver's withdrawals (driver only)
router.get("/", protect, restrictTo("driver"), async (req, res) => {
  try {
    const { status, limit = 20, skip = 0 } = req.query;
    
    const filter = { driverId: req.user._id };
    if (status) filter.status = status;
    
    const withdrawals = await Withdrawal.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip))
      .lean();
    
    const total = await Withdrawal.countDocuments(filter);
    const pendingAmount = await Withdrawal.aggregate([
      { $match: { driverId: req.user._id, status: "pending" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    res.json({
      withdrawals,
      total,
      pendingAmount: pendingAmount[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/withdrawals — Create withdrawal request (driver only)
router.post(
  "/",
  protect,
  restrictTo("driver"),
  [
    body("amount").isFloat({ min: 1 }).withMessage("Amount must be at least ₹1"),
    body("withdrawalMethod").isIn(["bank", "cash"]).withMessage("Invalid withdrawal method"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { amount, withdrawalMethod, notes } = req.body;

    try {
      // Check if driver has enough earnings
      if (req.user.earnings < amount) {
        return res.status(400).json({ message: "Insufficient earnings. Your available earnings: ₹" + req.user.earnings });
      }

      // Check for bank withdrawal details if method is bank
      if (withdrawalMethod === "bank") {
        if (!req.user.bankAccountNumber || !req.user.ifscCode) {
          return res.status(400).json({ message: "Please add bank account details in your profile before requesting bank withdrawal." });
        }
      }

      // Create withdrawal request
      const withdrawal = await Withdrawal.create({
        driverId: req.user._id,
        amount: Number(amount),
        withdrawalMethod,
        bankAccountNumber: withdrawalMethod === "bank" ? req.user.bankAccountNumber : null,
        ifscCode: withdrawalMethod === "bank" ? req.user.ifscCode : null,
        accountHolderName: withdrawalMethod === "bank" ? req.user.fullName : null,
        notes: withdrawalMethod === "cash" ? notes : null,
      });

      // Deduct amount from driver's earnings (temporarily)
      req.user.earnings -= Number(amount);
      await req.user.save();

      res.status(201).json({
        success: true,
        withdrawal,
        message: "Withdrawal request submitted successfully",
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// GET /api/withdrawals/admin — Get all withdrawals (admin only)
router.get("/admin", protect, restrictTo("admin"), async (req, res) => {
  try {
    const { status, limit = 50, skip = 0 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    
    const withdrawals = await Withdrawal.find(filter)
      .populate("driverId", "fullName email phone")
      .populate("processedBy", "fullName email")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip))
      .lean();
    
    const total = await Withdrawal.countDocuments(filter);
    
    // Get statistics
    const stats = await Withdrawal.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" }
        }
      }
    ]);
    
    res.json({
      withdrawals,
      total,
      stats: stats.reduce((acc, stat) => {
        acc[stat._id] = { count: stat.count, totalAmount: stat.totalAmount };
        return acc;
      }, {}),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/withdrawals/:id/approve — Approve withdrawal (admin only)
router.patch("/:id/approve", protect, restrictTo("admin"), async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal not found" });
    }

    if (withdrawal.status !== "pending") {
      return res.status(400).json({ message: "Withdrawal is not in pending status" });
    }

    // Update withdrawal status
    withdrawal.status = "approved";
    withdrawal.processedBy = req.user._id;
    withdrawal.processedAt = new Date();
    withdrawal.transactionReference = `WD-${Date.now()}`;
    await withdrawal.save();

    res.json({
      success: true,
      message: "Withdrawal approved successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/withdrawals/:id/mark-paid — Mark withdrawal as paid (admin only, for cash withdrawals)
router.patch("/:id/mark-paid", protect, restrictTo("admin"), async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal not found" });
    }

    if (withdrawal.status !== "approved") {
      return res.status(400).json({ message: "Withdrawal must be approved before marking as paid" });
    }

    // Update withdrawal status to paid
    withdrawal.status = "paid";
    withdrawal.processedBy = req.user._id;
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    res.json({
      success: true,
      message: "Withdrawal marked as paid successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/withdrawals/:id/reject — Reject withdrawal (admin only)
router.patch("/:id/reject", protect, restrictTo("admin"), async (req, res) => {
  try {
    const { reason } = req.body;
    
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal not found" });
    }

    if (withdrawal.status !== "pending") {
      return res.status(400).json({ message: "Withdrawal is not in pending status" });
    }

    // Update withdrawal status
    withdrawal.status = "rejected";
    withdrawal.rejectionReason = reason || "Withdrawal rejected by admin";
    withdrawal.processedBy = req.user._id;
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    // Refund amount back to driver's earnings
    const driver = await User.findById(withdrawal.driverId);
    if (driver) {
      driver.earnings += withdrawal.amount;
      await driver.save();
    }

    res.json({
      success: true,
      message: "Withdrawal rejected and amount refunded to driver's earnings",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/withdrawals/:id — Cancel withdrawal request (driver only, if pending)
router.delete("/:id", protect, restrictTo("driver"), async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal not found" });
    }

    if (String(withdrawal.driverId) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only cancel your own withdrawals" });
    }

    if (withdrawal.status !== "pending") {
      return res.status(400).json({ message: "Only pending withdrawals can be cancelled" });
    }

    // Refund amount back to driver's earnings
    req.user.earnings += withdrawal.amount;
    await req.user.save();

    // Delete withdrawal
    await Withdrawal.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Withdrawal cancelled and amount refunded to your earnings",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

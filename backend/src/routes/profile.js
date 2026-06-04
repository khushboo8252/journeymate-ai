const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { protect, restrictTo } = require("../middleware/auth");
const { sendDriverApprovalRequestEmail } = require("../utils/email");

const router = express.Router();

// GET /api/profile — get own profile
router.get("/", protect, (req, res) => {
  res.json({ status: "success", user: req.user.toPublic() });
});

// PUT /api/profile — update basic profile (all roles)
router.put(
  "/",
  protect,
  [
    body("fullName").optional().trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("phone").optional().trim(),
    body("avatarUrl").optional().trim(),
    body("avatarPublicId").optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { fullName, phone, avatarUrl, avatarPublicId } = req.body;

    try {
      const user = await User.findByIdAndUpdate(
        req.user._id,
        {
          ...(fullName && { fullName }),
          ...(phone !== undefined && { phone }),
          ...(avatarUrl !== undefined && { avatarUrl }),
          ...(avatarPublicId !== undefined && { avatarPublicId }),
        },
        { new: true, runValidators: true }
      );
      res.json({ status: "success", user: user.toPublic() });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// PUT /api/profile/driver — driver onboarding (drivers only)
router.put(
  "/driver",
  protect,
  restrictTo("driver"),
  [
    body("fullName").optional().trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("phone").trim().notEmpty().withMessage("Phone number is required"),
    body("avatarUrl").optional().trim(),
    body("avatarPublicId").optional().trim(),
    body("vehicleSeats")
      .isInt({ min: 1, max: 15 })
      .withMessage("Vehicle seats must be between 1 and 15"),
    body("bankAccountNumber")
      .trim()
      .isLength({ min: 9, max: 18 })
      .withMessage("Enter a valid bank account number"),
    body("ifscCode")
      .trim()
      .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
      .withMessage("Enter a valid IFSC code (e.g. SBIN0001234)"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Driver profile validation errors:", errors.array());
      console.log("Request body:", req.body);
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const { fullName, phone, avatarUrl, avatarPublicId, vehicleSeats, bankAccountNumber, ifscCode, vehicleNumber, drivingLicense, aadharCard, panCard, rc, vehicleImage } = req.body;

    try {
      const user = await User.findByIdAndUpdate(
        req.user._id,
        {
          ...(fullName && { fullName }),
          phone,
          ...(avatarUrl !== undefined && { avatarUrl }),
          ...(avatarPublicId !== undefined && { avatarPublicId }),
          vehicleSeats: Number(vehicleSeats),
          bankAccountNumber,
          ifscCode: ifscCode.toUpperCase(),
          ...(vehicleNumber && { vehicleNumber }),
          ...(drivingLicense && { drivingLicense }),
          ...(aadharCard && { aadharCard }),
          ...(panCard && { panCard }),
          ...(rc && { rc }),
          ...(vehicleImage && { vehicleImage }),
          isProfileComplete: true,
          isApproved: false, // Requires admin approval
        },
        { new: true, runValidators: true }
      );

      // Send email notification to admin
      await sendDriverApprovalRequestEmail(user);

      res.json({ status: "success", user: user.toPublic(), requiresApproval: true });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// GET /api/profile/driver/banking — return masked banking details (driver only)
router.get("/driver/banking", protect, restrictTo("driver"), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("+bankAccountNumber +ifscCode");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({
      status: "success",
      banking: {
        bankAccountNumber: user.bankAccountNumber
          ? `${"*".repeat(user.bankAccountNumber.length - 4)}${user.bankAccountNumber.slice(-4)}`
          : null,
        ifscCode: user.ifscCode,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/profile/notification-seen — mark approval notification as seen
router.post("/notification-seen", protect, restrictTo("driver"), async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { hasSeenApprovalNotification: true });
    res.json({ status: "success" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/profile/fcm-token — register an FCM device token for push notifications
router.post("/fcm-token", protect, async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: "FCM token is required" });
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { fcmTokens: token },
    });
    res.json({ status: "success" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/profile/fcm-token — remove an FCM device token (on logout)
router.delete("/fcm-token", protect, async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: "FCM token is required" });
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { fcmTokens: token },
    });
    res.json({ status: "success" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

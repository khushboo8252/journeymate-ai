const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Sign a JWT embedding both id and role so middleware never needs an extra DB hit */
const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

/** Validate request and return first error message if any */
const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return false;
  }
  return true;
};

// ─── POST /api/auth/register ─────────────────────────────────────────────────
router.post(
  "/register",
  [
    body("fullName").trim().isLength({ min: 2 }).withMessage("Full name must be at least 2 characters"),
    body("email").isEmail().normalizeEmail().withMessage("Enter a valid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("phone").optional().trim().isLength({ min: 10 }).withMessage("Enter a valid mobile number"),
    body("role")
      .optional()
      .isIn(["driver", "passenger"])
      .withMessage("Role must be 'driver' or 'passenger'"),
  ],
  async (req, res) => {
    if (!validate(req, res)) return;

    const { fullName, email, phone, password, role = "passenger" } = req.body;

    try {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ message: "An account with this email already exists." });
      }

      const user = await User.create({ fullName, email, phone: phone || null, password, role });
      const token = signToken(user._id, user.role);

      res.status(201).json({
        status: "success",
        token,
        user: user.toPublic(),
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ─── POST /api/auth/login ────────────────────────────────────────────────────
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Enter a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    if (!validate(req, res)) return;

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email }).select("+password +passwordChangedAt");
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      const token = signToken(user._id, user.role);

      res.json({
        status: "success",
        token,
        user: user.toPublic(),
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ─── GET /api/auth/me ────────────────────────────────────────────────────────
router.get("/me", protect, (req, res) => {
  res.json({ status: "success", user: req.user.toPublic() });
});

// ─── PATCH /api/auth/change-password ────────────────────────────────────────
router.patch(
  "/change-password",
  protect,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
  ],
  async (req, res) => {
    if (!validate(req, res)) return;

    const { currentPassword, newPassword } = req.body;

    try {
      const user = await User.findById(req.user._id).select("+password");
      if (!(await user.comparePassword(currentPassword))) {
        return res.status(401).json({ message: "Current password is incorrect." });
      }

      user.password = newPassword;
      await user.save();

      const token = signToken(user._id, user.role);
      res.json({ status: "success", token, message: "Password updated successfully." });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;

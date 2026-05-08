const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

// GET /api/profile
router.get("/", protect, (req, res) => {
  res.json(req.user.toPublic());
});

// PUT /api/profile
router.put(
  "/",
  protect,
  [
    body("fullName").optional().trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("phone").optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { fullName, phone } = req.body;

    try {
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { ...(fullName && { fullName }), ...(phone !== undefined && { phone }) },
        { new: true, runValidators: true }
      );
      res.json(user.toPublic());
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;

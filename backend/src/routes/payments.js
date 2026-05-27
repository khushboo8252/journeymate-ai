const express = require("express");
const { body, validationResult } = require("express-validator");
const { protect } = require("../middleware/auth");
const {
  createUpfrontPaymentOrder,
  processUpfrontPayment,
  createRemainingPaymentOrder,
  processRemainingPayment,
} = require("../services/paymentService");

const router = express.Router();

// POST /api/payments/upfront-order - Create order for 25% upfront payment
router.post(
  "/upfront-order",
  protect,
  [body("rideId").notEmpty().withMessage("Ride ID is required")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { rideId } = req.body;
    const userId = req.user._id;

    try {
      const order = await createUpfrontPaymentOrder(rideId, userId);
      res.json(order);
    } catch (err) {
      console.error("Create upfront order error:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

// POST /api/payments/verify-upfront - Verify and process upfront payment
router.post(
  "/verify-upfront",
  protect,
  [
    body("rideId").notEmpty().withMessage("Ride ID is required"),
    body("paymentId").notEmpty().withMessage("Payment ID is required"),
    body("signature").notEmpty().withMessage("Signature is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { rideId, paymentId, signature } = req.body;
    const userId = req.user._id;

    try {
      const result = await processUpfrontPayment(rideId, paymentId, signature, userId);
      res.json(result);
    } catch (err) {
      console.error("Verify upfront payment error:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

// POST /api/payments/remaining-order - Create order for 75% remaining payment
router.post(
  "/remaining-order",
  protect,
  [body("rideId").notEmpty().withMessage("Ride ID is required")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { rideId } = req.body;
    const userId = req.user._id;

    try {
      const order = await createRemainingPaymentOrder(rideId, userId);
      res.json(order);
    } catch (err) {
      console.error("Create remaining order error:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

// POST /api/payments/verify-remaining - Verify and process remaining payment
router.post(
  "/verify-remaining",
  protect,
  [
    body("rideId").notEmpty().withMessage("Ride ID is required"),
    body("paymentId").notEmpty().withMessage("Payment ID is required"),
    body("signature").notEmpty().withMessage("Signature is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { rideId, paymentId, signature } = req.body;
    const userId = req.user._id;

    try {
      const result = await processRemainingPayment(rideId, paymentId, signature, userId);
      res.json(result);
    } catch (err) {
      console.error("Verify remaining payment error:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;

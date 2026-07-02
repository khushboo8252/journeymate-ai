const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const Ride = require("../models/Ride");
const Booking = require("../models/Booking");
const Wallet = require("../models/Wallet"); // 🚨 NAYA ADD KIYA
const Transaction = require("../models/Transaction"); // 🚨 NAYA ADD KIYA
const { protect, adminOnly } = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const { sendDriverApprovalEmail } = require("../utils/email");

const router = express.Router();

// POST /api/admin/login
router.post(
  "/login",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { username, password } = req.body;

    try {
      if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      const token = jwt.sign(
        { type: "admin", username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
      );

      res.json({ token, username });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// GET /api/admin/users
router.get("/users", adminAuth, async (req, res) => {
  try {
    const users = await User.find().select("-password -passwordChangedAt -bankAccountNumber -ifscCode").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/drivers
router.get("/drivers", adminAuth, async (req, res) => {
  try {
    const drivers = await User.find({ role: "driver" })
      .select("fullName email phone role avatarUrl vehicleSeats vehicleNumber isProfileComplete bankAccountNumber ifscCode earnings isBlocked isApproved createdAt drivingLicense aadharCard panCard rc vehicleImage insuranceCertificate pollutionCertificate")
      .sort({ createdAt: -1 });

    const driversWithStats = await Promise.all(
      drivers.map(async (driver) => {
        const rideCount = await Ride.countDocuments({ driverId: driver._id });
        const completedRides = await Ride.countDocuments({ driverId: driver._id, status: "completed" });
        const activeRides = await Ride.countDocuments({ driverId: driver._id, status: "active" });

        const rides = await Ride.find({ driverId: driver._id, status: "completed" });
        const revenue = rides.reduce((sum, ride) => sum + (ride.pricePerSeat * (ride.seatsTotal - ride.seatsAvailable)), 0);

        const activeRideIds = (await Ride.find({ driverId: driver._id, status: "active" })).map(r => r._id);
        const pendingBookings = await Booking.countDocuments({
          rideId: { $in: activeRideIds },
          status: "confirmed",
        });

        return {
          ...driver.toObject(),
          rideCount,
          completedRides,
          activeRides,
          revenue,
          pendingPassengers: pendingBookings,
          earnings: driver.earnings || 0,
        };
      })
    );

    res.json(driversWithStats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🚨 [FIXED]: NAYA MANUAL SETTLEMENT LOGIC (Purana release-payment hata diya)

// GET /api/admin/settlements — Fetch all drivers with pending ledger balances
router.get("/settlements", adminAuth, async (req, res) => {
  try {
    const pendingWallets = await Wallet.find({ pendingBalance: { $gt: 0 } })
      .populate("userId", "fullName phone email avatarUrl")
      .sort({ pendingBalance: -1 });
    res.status(200).json(pendingWallets);
  } catch (error) {
    console.error("Error fetching settlements:", error);
    res.status(500).json({ message: "Server error fetching settlements" });
  }
});

// POST /api/admin/settlements/:userId/clear — Mark a driver's pending payout as paid
router.post("/settlements/:userId/clear", adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, upiReference } = req.body; 

    const wallet = await Wallet.findOne({ userId });
    
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });
    if (wallet.pendingBalance < amount) return res.status(400).json({ message: "Amount is greater than pending balance!" });

    wallet.pendingBalance -= amount;
    wallet.balance += amount; 
    await wallet.save();

    await Transaction.create({
      userId,
      type: "SETTLEMENT_CLEARED",
      amount,
      status: "COMPLETED",
      description: `Manual admin settlement via UPI. Ref: ${upiReference || 'N/A'}`
    });

    res.status(200).json({ success: true, message: "Settlement cleared successfully", wallet });
  } catch (error) {
    console.error("Error clearing settlement:", error);
    res.status(500).json({ message: "Server error clearing settlement" });
  }
});

// POST /api/admin/drivers/:id/block
router.post("/drivers/:id/block", adminAuth, async (req, res) => {
  try {
    const driver = await User.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: "Driver not found." });
    if (driver.role !== "driver") return res.status(400).json({ message: "User is not a driver." });

    driver.isBlocked = true;
    await driver.save();

    await Ride.updateMany({ driverId: driver._id, status: "active" }, { status: "cancelled" });
    res.json({ message: "Driver blocked successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/drivers/:id/unblock
router.post("/drivers/:id/unblock", adminAuth, async (req, res) => {
  try {
    const driver = await User.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: "Driver not found." });
    if (driver.role !== "driver") return res.status(400).json({ message: "User is not a driver." });

    driver.isBlocked = false;
    await driver.save();

    res.json({ message: "Driver unblocked successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/drivers/:id/approve
router.post("/drivers/:id/approve", adminAuth, async (req, res) => {
  try {
    const driver = await User.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: "Driver not found." });
    if (driver.role !== "driver") return res.status(400).json({ message: "User is not a driver." });

    driver.isApproved = true;
    driver.hasSeenApprovalNotification = false;
    await driver.save();

    await sendDriverApprovalEmail(driver.email, driver.fullName, true);

    if (global.io) {
      global.io.to(`user_${driver._id}`).emit("driver_approved", driver);
    }

    res.json({ message: "Driver profile approved successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/drivers/:id/reject
router.post("/drivers/:id/reject", 
  [
    body("rejectionReason").optional().isString().isLength({ min: 1, max: 500 }).withMessage("Rejection reason must be between 1 and 500 characters"),
  ],
  adminAuth, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  try {
    const driver = await User.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: "Driver not found." });
    if (driver.role !== "driver") return res.status(400).json({ message: "User is not a driver." });

    driver.isApproved = false;
    driver.isProfileComplete = false;
    driver.rejectionReason = req.body.rejectionReason || null;
    driver.hasSeenApprovalNotification = false;
    await driver.save();

    await sendDriverApprovalEmail(driver.email, driver.fullName, false);

    if (global.io) {
      global.io.to(`user_${driver._id}`).emit("driver_rejected", { 
        driver, 
        rejectionReason: driver.rejectionReason 
      });
    }

    res.json({ message: "Driver profile rejected successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    await Ride.deleteMany({ driverId: req.params.id });
    await Booking.deleteMany({ passengerId: req.params.id });
    await User.findByIdAndDelete(req.params.id);
    
    res.json({ message: "User deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/rides
router.get("/rides", adminAuth, async (req, res) => {
  try {
    const rides = await Ride.find().populate("driverId", "fullName email phone").sort({ createdAt: -1 });
    res.json(rides);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/rides/:id
router.delete("/rides/:id", adminAuth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: "Ride not found." });

    await Booking.deleteMany({ rideId: req.params.id });
    await Ride.findByIdAndDelete(req.params.id);
    res.json({ message: "Ride deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/bookings
router.get("/bookings", adminAuth, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("passengerId", "fullName email phone")
      .populate("rideId", "origin destination departureAt pricePerSeat")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/bookings/:id
router.delete("/bookings/:id", adminAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found." });

    await Ride.findByIdAndUpdate(booking.rideId, { $inc: { seatsAvailable: booking.seats } });
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: "Booking deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/stats
router.get("/stats", adminAuth, async (req, res) => {
  try {
    const [userCount, rideCount, bookingCount] = await Promise.all([
      User.countDocuments(),
      Ride.countDocuments(),
      Booking.countDocuments(),
    ]);

    const activeRides = await Ride.countDocuments({ status: "active" });
    const completedRides = await Ride.countDocuments({ status: "completed" });
    const cancelledRides = await Ride.countDocuments({ status: "cancelled" });

    res.json({
      users: userCount,
      rides: rideCount,
      bookings: bookingCount,
      activeRides,
      completedRides,
      cancelledRides,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const Ride = require("../models/Ride");
const Booking = require("../models/Booking");
const Withdrawal = require("../models/Withdrawal");
const { protect, adminOnly } = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const { sendDriverApprovalEmail } = require("../utils/email");

const router = express.Router();

// POST /api/admin/login — admin login with .env credentials
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
      // Check credentials against .env
      if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // Generate admin token with type "admin"
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

// GET /api/admin/users — get all users
router.get("/users", adminAuth, async (req, res) => {
  try {
    const users = await User.find().select("-password -passwordChangedAt -bankAccountNumber -ifscCode").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/drivers — get all drivers with detailed info
router.get("/drivers", adminAuth, async (req, res) => {
  try {
    const drivers = await User.find({ role: "driver" })
      .select("+bankAccountNumber +ifscCode")
      .sort({ createdAt: -1 });

    // Get detailed stats for each driver
    const driversWithStats = await Promise.all(
      drivers.map(async (driver) => {
        const rideCount = await Ride.countDocuments({ driverId: driver._id });
        const completedRides = await Ride.countDocuments({ driverId: driver._id, status: "completed" });
        const activeRides = await Ride.countDocuments({ driverId: driver._id, status: "active" });

        // Calculate earnings from completed rides (sum of pricePerSeat * seatsTotal)
        const rides = await Ride.find({ driverId: driver._id, status: "completed" });
        const revenue = rides.reduce((sum, ride) => sum + (ride.pricePerSeat * (ride.seatsTotal - ride.seatsAvailable)), 0);

        // Get pending passengers (confirmed bookings for active rides)
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

// POST /api/admin/drivers/:id/release-payment — release payment to driver
router.post("/drivers/:id/release-payment", adminAuth, async (req, res) => {
  try {
    const driver = await User.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: "Driver not found." });
    if (driver.role !== "driver") return res.status(400).json({ message: "User is not a driver." });

    // Calculate total earnings from completed rides
    const rides = await Ride.find({ driverId: driver._id, status: "completed" });
    const totalEarnings = rides.reduce((sum, ride) => sum + (ride.pricePerSeat * (ride.seatsTotal - ride.seatsAvailable)), 0);

    // Update driver's earnings (or could transfer to bank)
    driver.earnings = totalEarnings;
    await driver.save();

    res.json({ message: "Payment released successfully", earnings: driver.earnings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/drivers/:id/block — block a driver
router.post("/drivers/:id/block", adminAuth, async (req, res) => {
  try {
    const driver = await User.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: "Driver not found." });
    if (driver.role !== "driver") return res.status(400).json({ message: "User is not a driver." });

    driver.isBlocked = true;
    await driver.save();

    // Cancel all active rides for blocked driver
    await Ride.updateMany(
      { driverId: driver._id, status: "active" },
      { status: "cancelled" }
    );

    res.json({ message: "Driver blocked successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/drivers/:id/unblock — unblock a driver
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

// POST /api/admin/drivers/:id/approve — approve driver profile
router.post("/drivers/:id/approve", adminAuth, async (req, res) => {
  try {
    const driver = await User.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: "Driver not found." });
    if (driver.role !== "driver") return res.status(400).json({ message: "User is not a driver." });

    driver.isApproved = true;
    driver.hasSeenApprovalNotification = false; // Reset flag to show popup
    await driver.save();

    // Send email notification to driver
    await sendDriverApprovalEmail(driver.email, driver.fullName, true);

    // Emit real-time event for driver approval
    global.io.to(`user_${driver._id}`).emit("driver_approved", driver);

    res.json({ message: "Driver profile approved successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/drivers/:id/reject — reject driver profile
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
    driver.hasSeenApprovalNotification = false; // Reset flag to show rejection notification
    await driver.save();

    // Send email notification to driver
    await sendDriverApprovalEmail(driver.email, driver.fullName, false);

    // Emit real-time event for driver rejection with reason
    global.io.to(`user_${driver._id}`).emit("driver_rejected", { 
      driver, 
      rejectionReason: driver.rejectionReason 
    });

    res.json({ message: "Driver profile rejected successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/users/:id — delete user
router.delete("/users/:id", adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    // Also delete user's rides and bookings
    await Ride.deleteMany({ driverId: req.params.id });
    await Booking.deleteMany({ passengerId: req.params.id });

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/rides — get all rides
router.get("/rides", adminAuth, async (req, res) => {
  try {
    const rides = await Ride.find()
      .populate("driverId", "fullName email phone")
      .sort({ createdAt: -1 });
    res.json(rides);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/rides/:id — delete ride
router.delete("/rides/:id", adminAuth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: "Ride not found." });

    // Also delete bookings for this ride
    await Booking.deleteMany({ rideId: req.params.id });

    await Ride.findByIdAndDelete(req.params.id);
    res.json({ message: "Ride deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/bookings — get all bookings
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

// DELETE /api/admin/bookings/:id — delete booking
router.delete("/bookings/:id", adminAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found." });

    // Restore seat availability
    await Ride.findByIdAndUpdate(booking.rideId, {
      $inc: { seatsAvailable: booking.seats },
    });

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: "Booking deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/stats — get dashboard statistics
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

    // Calculate total revenue from completed rides
    const completedRidesData = await Ride.find({ status: "completed" });
    const totalRevenue = completedRidesData.reduce((sum, ride) => {
      // Calculate revenue from actual payments (totalFare or pricePerSeat * booked seats)
      const bookedSeats = ride.seatsTotal - ride.seatsAvailable;
      return sum + (ride.totalFare || (ride.pricePerSeat * bookedSeats));
    }, 0);

    // Calculate platform commission (10% of total revenue)
    const platformCommission = totalRevenue * 0.1;
    const driverEarnings = totalRevenue - platformCommission;

    res.json({
      users: userCount,
      rides: rideCount,
      bookings: bookingCount,
      activeRides,
      completedRides,
      cancelledRides,
      totalRevenue,
      platformCommission,
      driverEarnings,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/withdrawals — Get all withdrawals (admin only)
router.get("/withdrawals", adminAuth, async (req, res) => {
  try {
    const { status, limit = 50, skip = 0 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    
    const withdrawals = await Withdrawal.find(filter)
      .populate("driverId", "fullName email")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip))
      .lean();
    
    const stats = await Withdrawal.aggregate([
      { $group: { 
        _id: "$status", 
        count: { $sum: 1 },
        total: { $sum: "$amount" }
      }}
    ]);
    
    const statsMap = {};
    stats.forEach(s => {
      statsMap[s._id] = { count: s.count, total: s.total };
    });
    
    res.json({
      withdrawals,
      stats: {
        pending: statsMap.pending || { count: 0, total: 0 },
        approved: statsMap.approved || { count: 0, total: 0 },
        paid: statsMap.paid || { count: 0, total: 0 },
        rejected: statsMap.rejected || { count: 0, total: 0 },
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/admin/withdrawals/:id/approve — Approve withdrawal (admin only)
router.patch("/withdrawals/:id/approve", adminAuth, async (req, res) => {
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
    withdrawal.processedBy = req.user?._id || null;
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    res.json({
      success: true,
      message: "Withdrawal approved successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/admin/withdrawals/:id/mark-paid — Mark withdrawal as paid (admin only, for cash withdrawals)
router.patch("/withdrawals/:id/mark-paid", adminAuth, async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal not found" });
    }

    if (withdrawal.status !== "approved") {
      return res.status(400).json({ message: "Withdrawal must be approved before marking as paid" });
    }

    if (withdrawal.withdrawalMethod !== "cash") {
      return res.status(400).json({ message: "Only cash withdrawals can be marked as paid manually" });
    }

    // Update withdrawal status
    withdrawal.status = "paid";
    withdrawal.processedBy = req.user?._id || null;
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    res.json({
      success: true,
      message: "Withdrawal marked as paid",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/admin/withdrawals/:id/reject — Reject withdrawal (admin only)
router.patch("/withdrawals/:id/reject", adminAuth, async (req, res) => {
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
    withdrawal.processedBy = req.user?._id || null;
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    // Refund amount back to driver's earnings
    const driver = await User.findById(withdrawal.driverId);
    if (driver) {
      driver.earnings = (driver.earnings || 0) + withdrawal.amount;
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

module.exports = router;

const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const Ride = require("../models/Ride");
const Booking = require("../models/Booking");
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
// GET /api/admin/drivers — get all drivers with detailed info
router.get("/drivers", adminAuth, async (req, res) => {
  try {
    // [FIX] Bina kisi '+' ke saari fields ko clearly select kar rhe hain taaki Mongoose sab fetch kare
    const drivers = await User.find({ role: "driver" })
      .select("fullName email phone role avatarUrl vehicleSeats vehicleNumber isProfileComplete bankAccountNumber ifscCode earnings isBlocked isApproved createdAt drivingLicense aadharCard panCard rc vehicleImage")
      .sort({ createdAt: -1 });

    // Get detailed stats for each driver
    const driversWithStats = await Promise.all(
      drivers.map(async (driver) => {
        const rideCount = await Ride.countDocuments({ driverId: driver._id });
        const completedRides = await Ride.countDocuments({ driverId: driver._id, status: "completed" });
        const activeRides = await Ride.countDocuments({ driverId: driver._id, status: "active" });

        // Calculate earnings from completed rides
        const rides = await Ride.find({ driverId: driver._id, status: "completed" });
        const revenue = rides.reduce((sum, ride) => sum + (ride.pricePerSeat * (ride.seatsTotal - ride.seatsAvailable)), 0);

        // Get pending passengers
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

    const rides = await Ride.find({ driverId: driver._id, status: "completed" });
    const totalEarnings = rides.reduce((sum, ride) => sum + (ride.pricePerSeat * (ride.seatsTotal - ride.seatsAvailable)), 0);

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

// DELETE /api/admin/users/:id — delete user
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
const express = require("express");
const { body, validationResult } = require("express-validator");
const Ride = require("../models/Ride");
const Booking = require("../models/Booking");
const Seat = require("../models/Seat");
const { protect, restrictTo } = require("../middleware/auth");
const { generateSeats, getTotalSeats } = require("../utils/seatGenerator");
const { createRemainingPaymentOrder, processRemainingPayment } = require("../services/paymentService");

const router = express.Router();

// GET /api/rides — search rides
router.get("/", async (req, res) => {
  try {
    const { from, to, date, seats = 1, sortBy = "departureAt" } = req.query;

    const filter = { status: "active", seatsAvailable: { $gte: Number(seats) } };

    if (from) filter.origin = { $regex: from, $options: "i" };
    if (to) filter.destination = { $regex: to, $options: "i" };

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.departureAt = { $gte: start, $lte: end };
    }

    const sortMap = {
      departureAt: { departureAt: 1 },
      pricePerSeat: { pricePerSeat: 1 },
      seatsAvailable: { seatsAvailable: -1 },
    };
    const sort = sortMap[sortBy] || { departureAt: 1 };

    const rides = await Ride.find(filter)
      .sort(sort)
      .populate("driverId", "fullName avatarUrl")
      .lean();

    res.json(rides);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/rides/my — current user's rides as driver
router.get("/my", protect, async (req, res) => {
  try {
    const rides = await Ride.find({ driverId: req.user._id })
      .sort({ departureAt: -1 })
      .lean();
    res.json(rides);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/rides/:id — single ride with driver
router.get("/:id", async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate("driverId", "fullName avatarUrl phone vehicleSeats isProfileComplete role")
      .lean();
    if (!ride) return res.status(404).json({ message: "Ride not found." });
    res.json(ride);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/rides — create ride (drivers only)
router.post(
  "/",
  protect,
  restrictTo("driver"),
  [
    body("origin").trim().isLength({ min: 2 }).withMessage("Origin is required"),
    body("destination").trim().isLength({ min: 2 }).withMessage("Destination is required"),
    body("departureAt").isISO8601().withMessage("Valid departure date/time required"),
    body("pricePerSeat").isFloat({ min: 1 }).withMessage("Price must be at least ₹1"),
    body("arrivalAt").optional().isISO8601().withMessage("Valid arrival date/time required"),
    body("vehicleType").optional().isIn(["hatchback", "sedan", "suv", "mpv", "van"]).withMessage("Invalid vehicle type"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { origin, destination, departureAt, arrivalAt, pricePerSeat, description, vehicleType = "sedan" } = req.body;

    try {
      // Get total seats based on vehicle type
      const seatsTotal = getTotalSeats(vehicleType);

      const ride = await Ride.create({
        driverId: req.user._id,
        origin,
        destination,
        departureAt: new Date(departureAt),
        arrivalAt: arrivalAt ? new Date(arrivalAt) : null,
        seatsTotal,
        seatsAvailable: seatsTotal - 1, // Minus driver seat
        pricePerSeat: Number(pricePerSeat),
        description: description || null,
        vehicleType,
      });

      // Auto-generate seats for the ride
      const seatData = generateSeats(ride._id, vehicleType);
      await Seat.insertMany(seatData);

      // Emit real-time event for new ride
      global.io.emit("ride_created", ride);
      global.io.to(`driver_${req.user._id}`).emit("driver_ride_created", ride);

      res.status(201).json(ride);
    } catch (err) {
      console.error("Create ride error:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

// PATCH /api/rides/:id/cancel — driver cancels ride (drivers only)
router.patch("/:id/cancel", protect, restrictTo("driver"), async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: "Ride not found." });
    if (String(ride.driverId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Only the driver can cancel this ride." });
    }
    if (ride.status !== "active") {
      return res.status(400).json({ message: "Only active rides can be cancelled." });
    }

    ride.status = "cancelled";
    await ride.save();

    const bookings = await Booking.updateMany(
      { rideId: ride._id, status: "confirmed" },
      { status: "cancelled" }
    );

    // Emit real-time event for ride cancellation
    global.io.emit("ride_cancelled", ride);
    global.io.to(`driver_${req.user._id}`).emit("driver_ride_cancelled", ride);

    // Notify passengers who booked this ride
    const confirmedBookings = await Booking.find({ rideId: ride._id, status: "cancelled" });
    confirmedBookings.forEach((booking) => {
      global.io.to(`user_${booking.passengerId}`).emit("ride_cancelled", ride);
    });

    res.json(ride);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/rides/:id/complete-order — Create order for 75% remaining payment on ride completion
router.post(
  "/:id/complete-order",
  protect,
  async (req, res) => {
    try {
      const ride = await Ride.findById(req.params.id);
      if (!ride) return res.status(404).json({ message: "Ride not found." });
      if (ride.status !== "active") {
        return res.status(400).json({ message: "Ride is not active." });
      }
      if (ride.paymentStatus !== "PARTIAL_PAID") {
        return res.status(400).json({ message: "Upfront payment not completed." });
      }

      const order = await createRemainingPaymentOrder(ride._id, req.user._id);
      res.json(order);
    } catch (err) {
      console.error("Create complete order error:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

// POST /api/rides/:id/complete — Complete ride and process remaining payment
router.post(
  "/:id/complete",
  protect,
  [
    body("paymentId").notEmpty().withMessage("Payment ID is required"),
    body("signature").notEmpty().withMessage("Signature is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { paymentId, signature } = req.body;
    const rideId = req.params.id;
    const userId = req.user._id;

    try {
      const ride = await Ride.findById(rideId);
      if (!ride) return res.status(404).json({ message: "Ride not found." });
      if (String(ride.driverId) !== String(userId)) {
        return res.status(403).json({ message: "Only the driver can complete this ride." });
      }
      if (ride.status !== "active") {
        return res.status(400).json({ message: "Ride is not active." });
      }

      // Process remaining payment
      const result = await processRemainingPayment(rideId, paymentId, signature, userId);

      // Update ride status to completed
      ride.status = "completed";
      await ride.save();

      // Emit real-time events
      global.io.emit("ride_completed", ride);
      global.io.to(`driver_${userId}`).emit("driver_ride_completed", ride);

      // Notify all passengers on this ride
      const bookings = await Booking.find({ rideId, status: "confirmed" });
      bookings.forEach((booking) => {
        global.io.to(`user_${booking.passengerId}`).emit("ride_completed", ride);
      });

      res.json({ success: true, ride, driverEarning: result.driverEarning });
    } catch (err) {
      console.error("Complete ride error:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;

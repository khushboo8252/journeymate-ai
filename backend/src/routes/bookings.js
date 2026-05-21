const express = require("express");
const { body, validationResult } = require("express-validator");
const Booking = require("../models/Booking");
const Ride = require("../models/Ride");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

// GET /api/bookings/driver — all bookings on this driver's rides
router.get("/driver", protect, restrictTo("driver"), async (req, res) => {
  try {
    const rideIds = await Ride.find({ driverId: req.user._id }).distinct("_id");
    const bookings = await Booking.find({ rideId: { $in: rideIds } })
      .sort({ createdAt: -1 })
      .populate("passengerId", "fullName avatarUrl phone email")
      .populate("rideId", "origin destination departureAt pricePerSeat seatsTotal")
      .lean();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/bookings/my — passenger's own bookings
router.get("/my", protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ passengerId: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "rideId",
        populate: { path: "driverId", select: "fullName" },
      })
      .lean();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/bookings — book a seat
router.post(
  "/",
  protect,
  [
    body("rideId").notEmpty().withMessage("Ride ID is required"),
    body("seats").isInt({ min: 1 }).withMessage("At least 1 seat required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { rideId, seats } = req.body;

    try {
      const ride = await Ride.findById(rideId);
      if (!ride) return res.status(404).json({ message: "Ride not found." });
      if (ride.status !== "active") {
        return res.status(400).json({ message: "This ride is no longer available." });
      }
      if (String(ride.driverId) === String(req.user._id)) {
        return res.status(400).json({ message: "You cannot book your own ride." });
      }

      if (ride.seatsAvailable < Number(seats)) {
        return res.status(400).json({ message: `Only ${ride.seatsAvailable} seat(s) available.` });
      }

      const booking = await Booking.create({
        rideId,
        passengerId: req.user._id,
        seats: Number(seats),
      });

      ride.seatsAvailable -= Number(seats);
      await ride.save();

      // Emit real-time event for new booking
      const bookingWithDetails = await Booking.findById(booking._id)
        .populate("passengerId", "fullName avatarUrl phone email")
        .populate("rideId", "origin destination departureAt pricePerSeat seatsTotal")
        .lean();

      global.io.to(`driver_${ride.driverId}`).emit("new_booking", bookingWithDetails);
      global.io.to(`user_${req.user._id}`).emit("booking_created", bookingWithDetails);
      global.io.emit("ride_updated", ride);

      res.status(201).json(booking);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// PATCH /api/bookings/:id/cancel — passenger cancels booking
router.patch("/:id/cancel", protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (String(booking.passengerId) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only cancel your own bookings." });
    }
    if (booking.status !== "confirmed") {
      return res.status(400).json({ message: "Booking is already cancelled." });
    }

    booking.status = "cancelled";
    await booking.save();

    const ride = await Ride.findByIdAndUpdate(booking.rideId, {
      $inc: { seatsAvailable: booking.seats },
    });

    // Emit real-time event for booking cancellation
    global.io.to(`user_${req.user._id}`).emit("booking_cancelled", booking);
    if (ride) {
      global.io.to(`driver_${ride.driverId}`).emit("booking_cancelled", booking);
      global.io.emit("ride_updated", ride);
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

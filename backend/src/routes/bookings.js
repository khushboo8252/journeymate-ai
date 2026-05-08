const express = require("express");
const { body, validationResult } = require("express-validator");
const Booking = require("../models/Booking");
const Ride = require("../models/Ride");
const { protect } = require("../middleware/auth");

const router = express.Router();

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

      const existing = await Booking.findOne({
        rideId,
        passengerId: req.user._id,
        status: "confirmed",
      });
      if (existing) {
        return res.status(409).json({ message: "You have already booked this ride." });
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

      res.status(201).json(booking);
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ message: "You have already booked this ride." });
      }
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

    await Ride.findByIdAndUpdate(booking.rideId, {
      $inc: { seatsAvailable: booking.seats },
    });

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

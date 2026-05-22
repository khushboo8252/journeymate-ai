const express = require("express");
const { body, validationResult } = require("express-validator");
const Booking = require("../models/Booking");
const Ride = require("../models/Ride");
const Seat = require("../models/Seat");
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

// POST /api/bookings — book seats using seat numbers
router.post(
  "/",
  protect,
  [
    body("rideId").notEmpty().withMessage("Ride ID is required"),
    body("seatNumbers").isArray({ min: 1 }).withMessage("At least 1 seat number required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { rideId, seatNumbers } = req.body;
    const userId = req.user._id;

    try {
      const ride = await Ride.findById(rideId);
      if (!ride) return res.status(404).json({ message: "Ride not found." });
      if (ride.status !== "active") {
        return res.status(400).json({ message: "This ride is no longer available." });
      }
      if (String(ride.driverId) === String(userId)) {
        return res.status(400).json({ message: "You cannot book your own ride." });
      }

      // Validate that all requested seats are locked by this user
      const seats = await Seat.find({
        rideId,
        seatNumber: { $in: seatNumbers }
      });

      if (seats.length !== seatNumbers.length) {
        return res.status(400).json({ message: "Some seats do not exist." });
      }

      const invalidSeats = seats.filter(seat => 
        seat.status !== 'locked' || seat.lockedBy?.toString() !== userId.toString()
      );

      if (invalidSeats.length > 0) {
        return res.status(400).json({ 
          message: "Some seats are not available or locked by another user.",
          invalidSeats: invalidSeats.map(s => s.seatNumber)
        });
      }

      // Check for lock expiry
      const expiredSeats = seats.filter(seat => seat.hasLockExpired());
      if (expiredSeats.length > 0) {
        return res.status(400).json({ 
          message: "Some seat locks have expired. Please select seats again.",
          expiredSeats: expiredSeats.map(s => s.seatNumber)
        });
      }

      // Create booking
      const booking = await Booking.create({
        rideId,
        passengerId: userId,
        seats: seatNumbers.length,
        seatNumbers: seatNumbers
      });

      // Convert locked seats to booked
      await Seat.bookSeats(rideId, seatNumbers, userId, booking._id);

      // Update ride seatsAvailable
      const seatCounts = await Seat.getSeatCounts(rideId);
      ride.seatsAvailable = seatCounts.available;
      await ride.save();

      // Emit real-time events
      const bookingWithDetails = await Booking.findById(booking._id)
        .populate("passengerId", "fullName avatarUrl phone email")
        .populate("rideId", "origin destination departureAt pricePerSeat seatsTotal")
        .lean();

      global.io.to(`driver_${ride.driverId}`).emit("new_booking", bookingWithDetails);
      global.io.to(`user_${userId}`).emit("booking_created", bookingWithDetails);
      global.io.to(`ride_${rideId}`).emit("seat_booked", {
        rideId,
        seatNumbers,
        bookedBy: userId,
        passengerName: req.user.fullName
      });
      global.io.emit("ride_updated", ride);

      res.status(201).json(booking);
    } catch (err) {
      console.error("Booking error:", err);
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

    // Release seats back to available
    if (booking.seatNumbers && booking.seatNumbers.length > 0) {
      await Seat.releaseBookedSeats(booking.rideId, booking.seatNumbers);
    }

    // Update ride seatsAvailable
    const ride = await Ride.findById(booking.rideId);
    if (ride) {
      const seatCounts = await Seat.getSeatCounts(booking.rideId);
      ride.seatsAvailable = seatCounts.available;
      await ride.save();

      // Emit real-time events
      global.io.to(`user_${req.user._id}`).emit("booking_cancelled", booking);
      global.io.to(`driver_${ride.driverId}`).emit("booking_cancelled", booking);
      global.io.to(`ride_${booking.rideId}`).emit("seat_released", {
        rideId: booking.rideId,
        seatNumbers: booking.seatNumbers || []
      });
      global.io.emit("ride_updated", ride);
    }

    res.json(booking);
  } catch (err) {
    console.error("Cancel booking error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

const express = require("express");
const { body, validationResult } = require("express-validator");
const Booking = require("../models/Booking");
const Ride = require("../models/Ride");
const Seat = require("../models/Seat");
const User = require("../models/User");
const { protect, restrictTo } = require("../middleware/auth");
const { createUpfrontPaymentOrder, processUpfrontPayment } = require("../services/paymentService");
const { sendBookingNotificationEmail } = require("../utils/email");

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

// POST /api/bookings — book seats using seat count (creates pending booking)
router.post(
  "/",
  protect,
  [
    body("rideId").notEmpty().withMessage("Ride ID is required"),
    body("seats").isInt({ min: 1, max: 15 }).withMessage("Seats must be between 1 and 15"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { rideId, seats } = req.body;
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

      // Check if enough seats are available
      if (ride.seatsAvailable < seats) {
        return res.status(400).json({ message: `Only ${ride.seatsAvailable} seats available.` });
      }

      // Create pending booking
      const booking = await Booking.create({
        rideId,
        passengerId: userId,
        seats: seats,
        status: "pending_payment"
      });

      // Create upfront payment order (25% of total fare for booked seats)
      const paymentOrder = await createUpfrontPaymentOrder(rideId, userId, seats);

      res.status(201).json({
        booking,
        paymentOrder,
        requiresPayment: true,
        upfrontAmount: paymentOrder.amount,
      });
    } catch (err) {
      console.error("Booking error:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

// POST /api/bookings/confirm — Confirm booking after payment
router.post(
  "/confirm",
  protect,
  [
    body("bookingId").notEmpty().withMessage("Booking ID is required"),
    body("paymentId").notEmpty().withMessage("Payment ID is required"),
    body("signature").notEmpty().withMessage("Signature is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { bookingId, paymentId, signature } = req.body;
    const userId = req.user._id;

    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) return res.status(404).json({ message: "Booking not found." });
      if (String(booking.passengerId) !== String(userId)) {
        return res.status(403).json({ message: "You can only confirm your own bookings." });
      }
      if (booking.status !== "pending_payment") {
        return res.status(400).json({ message: "Booking is not in pending payment state." });
      }

      // Process upfront payment
      await processUpfrontPayment(booking.rideId, paymentId, signature, userId);

      // Update booking status
      booking.status = "confirmed";
      await booking.save();

      // Update ride seatsAvailable
      const ride = await Ride.findById(booking.rideId);
      ride.seatsAvailable = Math.max(0, ride.seatsAvailable - booking.seats);
      await ride.save();

      // Get driver details for email notification
      const driver = await User.findById(ride.driverId);
      const passenger = await User.findById(userId);

      // Send email notification to driver
      if (driver && driver.email && passenger) {
        const baseFare = ride.pricePerSeat * booking.seats;
        const platformFee = baseFare * 0.05;
        const afterFee = baseFare + platformFee;
        const gst = afterFee * 0.0952;
        const totalPrice = Math.round(baseFare + platformFee + gst);
        sendBookingNotificationEmail(
          driver.email,
          driver.fullName,
          passenger.fullName,
          passenger.phone,
          ride.origin,
          ride.destination,
          ride.departureAt,
          booking.seats,
          totalPrice,
          baseFare,
          platformFee,
          gst
        );
      }

      // Emit real-time events
      const bookingWithDetails = await Booking.findById(booking._id)
        .populate("passengerId", "fullName avatarUrl phone email")
        .populate("rideId", "origin destination departureAt pricePerSeat seatsTotal")
        .lean();

      global.io.to(`driver_${ride.driverId}`).emit("new_booking", bookingWithDetails);
      global.io.to(`user_${userId}`).emit("booking_created", bookingWithDetails);
      global.io.to(`ride_${booking.rideId}`).emit("seat_booked", {
        rideId: booking.rideId,
        seatNumbers: booking.seatNumbers,
        bookedBy: userId,
        passengerName: req.user.fullName
      });
      global.io.emit("ride_updated", ride);

      res.json({ success: true, booking: bookingWithDetails });
    } catch (err) {
      console.error("Confirm booking error:", err);
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

    // Update ride seatsAvailable
    const ride = await Ride.findById(booking.rideId);
    if (ride) {
      ride.seatsAvailable = Math.min(ride.seatsTotal, ride.seatsAvailable + booking.seats);
      await ride.save();

      // Emit real-time events
      global.io.to(`user_${req.user._id}`).emit("booking_cancelled", booking);
      global.io.to(`driver_${ride.driverId}`).emit("booking_cancelled", booking);
      global.io.emit("ride_updated", ride);
    }

    res.json(booking);
  } catch (err) {
    console.error("Cancel booking error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

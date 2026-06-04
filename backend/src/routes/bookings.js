const express = require("express");
const { body, validationResult } = require("express-validator");
const Booking = require("../models/Booking");
const Ride = require("../models/Ride");
const Seat = require("../models/Seat");
const { protect, restrictTo } = require("../middleware/auth");
const { createUpfrontPaymentOrder, processUpfrontPayment } = require("../services/paymentService");
const { sendToUser } = require("../services/notificationService");

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

// POST /api/bookings — book seats using seat numbers (creates pending booking)
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

      // Create pending booking
      const booking = await Booking.create({
        rideId,
        passengerId: userId,
        seats: seatNumbers.length,
        seatNumbers: seatNumbers,
        status: "pending_payment"
      });

      // Create upfront payment order (25% of total fare for booked seats)
      const paymentOrder = await createUpfrontPaymentOrder(rideId, userId, seatNumbers.length);

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

// POST /api/bookings/test-confirm — Test mode: confirm booking without Razorpay (development only)
router.post("/test-confirm", protect, async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ message: "Test mode not allowed in production." });
  }

  const { bookingId } = req.body;
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

    console.log("TEST MODE: Confirming booking without Razorpay", bookingId);

    // Update ride with mock payment data
    const ride = await Ride.findById(booking.rideId);
    if (ride) {
      ride.razorpayPaymentId = `test_payment_${Date.now()}`;
      ride.upfrontPaid = booking.upfrontAmount;
      ride.paymentStatus = "PARTIAL_PAID";
      await ride.save();
    }

    // Convert locked seats to booked
    await Seat.bookSeats(booking.rideId, booking.seatNumbers, userId, booking._id);

    // Update booking status
    booking.status = "confirmed";
    await booking.save();

    // Update ride seatsAvailable
    const seatCounts = await Seat.getSeatCounts(booking.rideId);
    ride.seatsAvailable = seatCounts.available;
    await ride.save();

    // Emit real-time events
    const io = global.io;
    if (io) {
      io.to(`ride_${booking.rideId}`).emit("seat_booked", {
        rideId: booking.rideId,
        seatNumbers: booking.seatNumbers,
        passengerId: userId,
      });
      io.to(`driver_${ride.driverId}`).emit("new_booking", booking);
    }

    // Send notification to driver
    await sendToUser(ride.driverId.toString(), {
      title: "New Booking Confirmed",
      body: `${booking.passengerName} booked ${booking.seatNumbers.length} seat(s) on your ride.`,
      data: { rideId: booking.rideId, bookingId: booking._id },
    });

    res.json({ success: true, booking });
  } catch (err) {
    console.error("Test confirm booking error:", err);
    res.status(500).json({ message: err.message });
  }
});

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

    const { bookingId, paymentId, signature, testMode } = req.body;
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

      // Process upfront payment (skip Razorpay verification in test mode)
      if (testMode && process.env.NODE_ENV !== "production") {
        console.log("TEST MODE: Skipping Razorpay verification for booking", bookingId);
        // Update ride with mock payment data
        const ride = await Ride.findById(booking.rideId);
        if (ride) {
          ride.razorpayPaymentId = paymentId;
          ride.upfrontPaid = booking.upfrontAmount;
          ride.paymentStatus = "PARTIAL_PAID";
          await ride.save();
        }
      } else {
        await processUpfrontPayment(booking.rideId, paymentId, signature, userId);
      }

      // Convert locked seats to booked
      await Seat.bookSeats(booking.rideId, booking.seatNumbers, userId, booking._id);

      // Update booking status
      booking.status = "confirmed";
      await booking.save();

      // Update ride seatsAvailable
      const ride = await Ride.findById(booking.rideId);
      const seatCounts = await Seat.getSeatCounts(booking.rideId);
      ride.seatsAvailable = seatCounts.available;
      await ride.save();

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

      // Push notification to driver
      sendToUser(ride.driverId, {
        title: "New Booking 🎉",
        body: `${req.user.fullName} booked seat${booking.seatNumbers.length > 1 ? "s" : ""} ${booking.seatNumbers.join(", ")}`,
        data: { type: "new_booking", rideId: booking.rideId.toString() },
      });

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

      // Push notification to driver
      sendToUser(ride.driverId, {
        title: "Booking Cancelled",
        body: `${req.user.fullName} cancelled their booking for ${ride.origin} → ${ride.destination}`,
        data: { type: "booking_cancelled", rideId: booking.rideId.toString() },
      });
    }

    res.json(booking);
  } catch (err) {
    console.error("Cancel booking error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

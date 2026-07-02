const express = require("express");
const { body, validationResult } = require("express-validator");
const Booking = require("../models/Booking");
const Ride = require("../models/Ride");
const Seat = require("../models/Seat");
const User = require("../models/User");
const { protect, restrictTo } = require("../middleware/auth");
const { createUpfrontPaymentOrder, processUpfrontPayment } = require("../services/paymentService");
const { sendBookingNotificationEmail, sendPassengerBookingConfirmationEmail } = require("../utils/email");

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
    body("seats").isInt({ min: 1, max: 12 }).withMessage("Seats must be between 1 and 12"),
    body("pickupPoint").optional().isString().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    // 🚨 NAYA LOGIC: deviationCharge aur driverCashFare backend receive karega
    const { rideId, seats, seatNumbers, pickupPoint, deviationCharge, driverCashFare } = req.body;
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
        seatNumbers: seatNumbers || [],
        pickupPoint: pickupPoint || null, 
        deviationCharge: deviationCharge || 0, // 🚨 SAVE EXTRA CHARGE
        driverCashFare: driverCashFare || 0,   // 🚨 SAVE TOTAL CASH
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

      // 🚨 [FIXED CODE]: Smartly mark seats as BOOKED and clear all locks
      if (booking.seatNumbers && booking.seatNumbers.length > 0) {
        await Seat.bookSeats(booking.rideId, booking.seatNumbers, userId, booking._id);
      } else {
        // Fallback: Agar seatNumbers missing hain, toh is user ki locked seats ko book kardo
        const lockedSeats = await Seat.find({ rideId: booking.rideId, status: "locked", lockedBy: userId });
        const lockedSeatNumbers = lockedSeats.map(s => s.seatNumber);
        if (lockedSeatNumbers.length > 0) {
          await Seat.bookSeats(booking.rideId, lockedSeatNumbers, userId, booking._id);
        }
      }

      // Get driver details for email notification
      const driver = await User.findById(ride.driverId);
      const passenger = await User.findById(userId);

      // Send email notification to driver
      if (driver && driver.email && passenger) {
        const basePricePerSeat = ride.pricePerSeat;
        const baseTotal = basePricePerSeat * booking.seats;
        const platformFee = Math.round(baseTotal * 0.05);
        const totalWithFee = baseTotal + platformFee;
        const upfrontAmount = Math.round(totalWithFee * 0.0952);
        const remainingAmount = Math.round(totalWithFee - upfrontAmount);
        
        sendBookingNotificationEmail(
          driver.email,
          driver.fullName,
          passenger.fullName,
          passenger.phone,
          ride.origin,
          ride.destination,
          ride.departureAt,
          booking.seats,
          baseTotal,
          platformFee,
          upfrontAmount,
          remainingAmount
        );

        // Send booking confirmation email to passenger
        sendPassengerBookingConfirmationEmail(
          passenger.email,
          passenger.fullName,
          driver.fullName,
          driver.phone,
          ride.origin,
          ride.destination,
          ride.departureAt,
          booking.seats,
          totalWithFee,
          upfrontAmount,
          remainingAmount
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

      // 🚨 [FIXED CODE]: Properly release seats and clear all old booking data
      if (booking.seatNumbers && booking.seatNumbers.length > 0) {
        await Seat.releaseBookedSeats(booking.rideId, booking.seatNumbers);
      }

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

// 🚨 SECURED ROUTE: Driver confirms passenger payment

router.patch("/:id/confirm-payment", protect, restrictTo("driver"), async (req, res) => {
  try {
    const bookingId = req.params.id;

    // Fetch booking along with ride details to check driver ownership
    const booking = await Booking.findById(bookingId).populate("rideId");
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Security Check: Make sure the person clicking is actually the driver of this ride
    if (String(booking.rideId.driverId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Unauthorized. Only the driver of this ride can confirm payment." });
    }

    // Update payment status inside MongoDB
    booking.isPaymentConfirmedByDriver = true; 
    await booking.save();

    // 🚨 [FIXED]: Server-side Secure Socket Event
    // Passenger ke personal room (`user_PASSENGER_ID`) mein event trigger hoga
    if (global.io && booking.passengerId) {
      global.io.to(`user_${booking.passengerId}`).emit("payment_confirmed", {
        rideId: booking.rideId._id,
        bookingId: booking._id,
        message: "Your cash/UPI payment has been verified by the driver."
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Payment confirmed successfully",
      booking 
    });

  } catch (error) {
    console.error("Error confirming payment:", error);
    return res.status(500).json({ message: "Server error confirming payment" });
  }
});
// POST /api/bookings/:id/notify-payment — Passenger notifies driver about cash/UPI payment
router.post("/:id/notify-payment", protect, async (req, res) => {
  try {
    const bookingId = req.params.id;
    // Populate karke rideId layenge taaki driver ka ID mil sake
    const booking = await Booking.findById(bookingId).populate("rideId");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Security Check: Make sure jo user request bhej raha hai, wo actual passenger hi ho
    if (String(booking.passengerId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Unauthorized. You cannot send notifications for this booking." });
    }

    const driverId = booking.rideId.driverId;
    const amount = req.body.amount;

    // Server securely driver ke exclusive room mein socket event fire karega
    global.io.to(`driver_${driverId}`).emit("passenger_paid_driver", {
      rideId: booking.rideId._id,
      bookingId: booking._id,
      driverId: driverId,
      amount: amount,
      passengerName: req.user.fullName
    });

    return res.status(200).json({ 
      success: true, 
      message: "Driver notified successfully." 
    });

  } catch (error) {
    console.error("Error notifying payment:", error);
    return res.status(500).json({ message: "Server error while notifying driver." });
  }
});
module.exports = router;
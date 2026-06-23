const express = require("express");
const { body, validationResult } = require("express-validator");
const Ride = require("../models/Ride");
const Booking = require("../models/Booking");
const Seat = require("../models/Seat");
const User = require("../models/User");
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

    console.log("Search rides filter:", filter);

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

    console.log("Found rides:", rides.length);

    res.json(rides);
  } catch (err) {
    console.error("Search rides error:", err);
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
      .populate("driverId", "fullName avatarUrl phone vehicleSeats isProfileComplete role rating totalRides responseRate")
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
    body("seatsTotal").optional().isInt({ min: 5, max: 15 }).withMessage("Total seats must be between 5 and 15"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { origin, destination, departureAt, arrivalAt, pricePerSeat, description, vehicleType = "sedan", seatsTotal } = req.body;

    try {
      // Check if driver is approved by admin
      const driver = await User.findById(req.user._id);
      console.log("Driver status check:", {
        driverId: req.user._id,
        isApproved: driver?.isApproved,
        isProfileComplete: driver?.isProfileComplete,
        role: driver?.role,
      });

      if (!driver.isApproved) {
        return res.status(403).json({
          message: "Your account is pending admin approval. You cannot publish rides until approved."
        });
      }

      // Use user-selected seatsTotal or fallback to vehicle type default
      const finalSeatsTotal = seatsTotal ? Number(seatsTotal) : getTotalSeats(vehicleType);

      const ride = await Ride.create({
        driverId: req.user._id,
        origin,
        destination,
        departureAt: new Date(departureAt),
        arrivalAt: arrivalAt ? new Date(arrivalAt) : null,
        seatsTotal: finalSeatsTotal,
        seatsAvailable: finalSeatsTotal - 1, // Exclude driver seat from available seats
        pricePerSeat: Number(pricePerSeat),
        description: description || null,
        vehicleType,
        isTrackingLocation: true, // Auto-start location tracking
      });

      // Auto-generate seats for the ride based on user-selected total
      const seatData = generateSeats(ride._id, vehicleType, finalSeatsTotal);
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

    // Check if driver is blocked
    const driver = await User.findById(req.user._id);
    if (driver.isBlocked) {
      return res.status(403).json({ 
        message: "Your account has been blocked due to excessive ride cancellations. Please contact support." 
      });
    }

    // Check if ride can be cancelled (must be at least 1 hour before departure)
    const now = new Date();
    const departureTime = new Date(ride.departureAt);
    const hoursUntilDeparture = (departureTime - now) / (1000 * 60 * 60);
    
    if (hoursUntilDeparture < 1) {
      return res.status(400).json({ 
        message: "Ride can only be cancelled at least 1 hour before departure time." 
      });
    }

    ride.status = "cancelled";
    await ride.save();

    // Get confirmed bookings for this ride
    const confirmedBookings = await Booking.find({ rideId: ride._id, status: "confirmed" });
    
    // Find driver's next available ride (after current ride's departure time)
    const nextRide = await Ride.findOne({
      driverId: req.user._id,
      status: "active",
      departureAt: { $gt: ride.departureAt }
    }).sort({ departureAt: 1 });

    if (nextRide && confirmedBookings.length > 0) {
      // Get driver details for notification
      const driver = await User.findById(req.user._id);
      const vehicleNumber = driver?.vehicleNumber || "N/A";
      const nextDepartureTime = new Date(nextRide.departureAt);
      const formattedTime = nextDepartureTime.toLocaleTimeString("en-US", { 
        hour: "2-digit", 
        minute: "2-digit",
        hour12: true 
      });

      // Check if next ride has enough seats for all passengers
      const totalSeatsNeeded = confirmedBookings.reduce((sum, booking) => sum + booking.seats, 0);
      
      if (nextRide.seatsAvailable >= totalSeatsNeeded) {
        // Transfer passengers to next ride
        for (const booking of confirmedBookings) {
          booking.rideId = nextRide._id;
          await booking.save();
          
          // Update next ride seat availability
          nextRide.seatsAvailable -= booking.seats;
        }
        await nextRide.save();

        // Notify passengers about transfer
        confirmedBookings.forEach((booking) => {
          global.io.to(`user_${booking.passengerId}`).emit("booking_transferred", {
            originalRideId: ride._id,
            newRideId: nextRide._id,
            newRide: nextRide,
            vehicleNumber,
            departureTime: formattedTime,
            message: `Your booking has been transferred to driver's next ride at ${formattedTime}. Vehicle: ${vehicleNumber}`
          });
        });

        // Notify driver about passenger transfer
        global.io.to(`driver_${req.user._id}`).emit("passengers_transferred", {
          originalRideId: ride._id,
          newRideId: nextRide._id,
          passengerCount: confirmedBookings.length,
          message: `${confirmedBookings.length} passenger(s) transferred to your next ride at ${formattedTime}`
        });
      } else {
        // Not enough seats - cancel bookings instead
        await Booking.updateMany(
          { rideId: ride._id, status: "confirmed" },
          { status: "cancelled" }
        );

        // Notify passengers about cancellation (no transfer possible)
        confirmedBookings.forEach((booking) => {
          global.io.to(`user_${booking.passengerId}`).emit("ride_cancelled", ride);
        });
      }
    } else {
      // No next ride available - cancel bookings
      await Booking.updateMany(
        { rideId: ride._id, status: "confirmed" },
        { status: "cancelled" }
      );

      // Notify passengers about cancellation
      confirmedBookings.forEach((booking) => {
        global.io.to(`user_${booking.passengerId}`).emit("ride_cancelled", ride);
      });
    }

    // Emit real-time event for ride cancellation
    global.io.emit("ride_cancelled", ride);
    global.io.to(`driver_${req.user._id}`).emit("driver_ride_cancelled", ride);

    // Increment cancellation count and check if driver should be blocked
    driver.rideCancellationCount = (driver.rideCancellationCount || 0) + 1;
    
    if (driver.rideCancellationCount >= 3) {
      driver.isBlocked = true;
      await driver.save();
      
      // Notify driver about account block
      global.io.to(`driver_${req.user._id}`).emit("driver_blocked", {
        message: "Your account has been blocked due to 3 ride cancellations. Please contact support."
      });
    } else {
      await driver.save();
      
      // Notify driver about remaining cancellations
      const remainingCancellations = 3 - driver.rideCancellationCount;
      global.io.to(`driver_${req.user._id}`).emit("cancellation_count_updated", {
        cancellationCount: driver.rideCancellationCount,
        remainingCancellations,
        message: `You have cancelled ${driver.rideCancellationCount} ride(s). ${remainingCancellations} more cancellation(s) will result in account block.`
      });
    }

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
      ride.isTrackingLocation = false; // Stop location tracking
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

// PATCH /api/rides/:id/location — Update driver location (drivers only)
router.patch(
  "/:id/location",
  protect,
  restrictTo("driver"),
  [
    body("latitude").isFloat({ min: -90, max: 90 }).withMessage("Valid latitude required"),
    body("longitude").isFloat({ min: -180, max: 180 }).withMessage("Valid longitude required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { latitude, longitude } = req.body;
    const rideId = req.params.id;
    const userId = req.user._id;

    try {
      const ride = await Ride.findById(rideId);
      if (!ride) return res.status(404).json({ message: "Ride not found." });
      if (String(ride.driverId) !== String(userId)) {
        return res.status(403).json({ message: "Only the driver can update location." });
      }
      if (!ride.isTrackingLocation) {
        return res.status(400).json({ message: "Location tracking is not enabled for this ride." });
      }

      const timestamp = new Date();

      // Update current location
      ride.currentLocation = {
        latitude,
        longitude,
        timestamp,
      };

      // Add to location history (keep last 100 points)
      ride.locationHistory.push({ latitude, longitude, timestamp });
      if (ride.locationHistory.length > 100) {
        ride.locationHistory.shift();
      }

      await ride.save();

      // Emit real-time location update to all passengers
      global.io.emit("driver_location_updated", {
        rideId: ride._id,
        currentLocation: ride.currentLocation,
        driverId: userId,
      });

      // Also notify specific passengers on this ride
      const bookings = await Booking.find({ rideId, status: "confirmed" });
      bookings.forEach((booking) => {
        global.io.to(`user_${booking.passengerId}`).emit("driver_location_updated", {
          rideId: ride._id,
          currentLocation: ride.currentLocation,
          driverId: userId,
        });
      });

      res.json({ success: true, currentLocation: ride.currentLocation });
    } catch (err) {
      console.error("Update location error:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

// PATCH /api/rides/:id/location/start — Start location tracking (drivers only)
router.patch("/:id/location/start", protect, restrictTo("driver"), async (req, res) => {
  const rideId = req.params.id;
  const userId = req.user._id;

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found." });
    if (String(ride.driverId) !== String(userId)) {
      return res.status(403).json({ message: "Only the driver can start location tracking." });
    }
    if (ride.status !== "active") {
      return res.status(400).json({ message: "Only active rides can be tracked." });
    }

    ride.isTrackingLocation = true;
    await ride.save();

    // Notify passengers that location tracking has started
    global.io.emit("location_tracking_started", {
      rideId: ride._id,
      driverId: userId,
    });

    const bookings = await Booking.find({ rideId, status: "confirmed" });
    bookings.forEach((booking) => {
      global.io.to(`user_${booking.passengerId}`).emit("location_tracking_started", {
        rideId: ride._id,
        driverId: userId,
      });
    });

    res.json({ success: true, isTrackingLocation: true });
  } catch (err) {
    console.error("Start location tracking error:", err);
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/rides/:id/location/stop — Stop location tracking (drivers only)
router.patch("/:id/location/stop", protect, restrictTo("driver"), async (req, res) => {
  const rideId = req.params.id;
  const userId = req.user._id;

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found." });
    if (String(ride.driverId) !== String(userId)) {
      return res.status(403).json({ message: "Only the driver can stop location tracking." });
    }

    ride.isTrackingLocation = false;
    await ride.save();

    // Notify passengers that location tracking has stopped
    global.io.emit("location_tracking_stopped", {
      rideId: ride._id,
      driverId: userId,
    });

    const bookings = await Booking.find({ rideId, status: "confirmed" });
    bookings.forEach((booking) => {
      global.io.to(`user_${booking.passengerId}`).emit("location_tracking_stopped", {
        rideId: ride._id,
        driverId: userId,
      });
    });

    res.json({ success: true, isTrackingLocation: false });
  } catch (err) {
    console.error("Stop location tracking error:", err);
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/rides/:id/confirm/driver — Driver confirms ride completion
router.patch("/:id/confirm/driver", protect, restrictTo("driver"), async (req, res) => {
  const rideId = req.params.id;
  const userId = req.user._id;

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found." });
    if (String(ride.driverId) !== String(userId)) {
      return res.status(403).json({ message: "Only the driver can confirm completion." });
    }
    if (ride.status !== "active") {
      return res.status(400).json({ message: "Ride is not active." });
    }

    ride.confirmByDriver = true;
    await ride.save();

    // Check if both have confirmed
    if (ride.confirmByDriver && ride.confirmByPassenger) {
      ride.status = "completed";
      ride.completedAt = new Date();
      ride.isTrackingLocation = false;
      await ride.save();

      // Notify both parties that ride is completed
      global.io.emit("ride_completed", {
        rideId: ride._id,
        status: "completed",
      });

      const bookings = await Booking.find({ rideId, status: "confirmed" });
      bookings.forEach((booking) => {
        global.io.to(`user_${booking.passengerId}`).emit("ride_completed", {
          rideId: ride._id,
          status: "completed",
        });
      });
      global.io.to(`user_${ride.driverId}`).emit("ride_completed", {
        rideId: ride._id,
        status: "completed",
      });
    } else {
      // Notify passenger that driver has confirmed
      const bookings = await Booking.find({ rideId, status: "confirmed" });
      bookings.forEach((booking) => {
        global.io.to(`user_${booking.passengerId}`).emit("driver_confirmed_completion", {
          rideId: ride._id,
        });
      });
    }

    res.json({ 
      success: true, 
      confirmByDriver: true,
      confirmByPassenger: ride.confirmByPassenger,
      isCompleted: ride.confirmByDriver && ride.confirmByPassenger
    });
  } catch (err) {
    console.error("Driver confirmation error:", err);
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/rides/:id/confirm/passenger — Passenger confirms ride completion
router.patch("/:id/confirm/passenger", protect, async (req, res) => {
  const rideId = req.params.id;
  const userId = req.user._id;

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found." });
    if (ride.status !== "active") {
      return res.status(400).json({ message: "Ride is not active." });
    }

    // Check if user is a passenger on this ride
    const booking = await Booking.findOne({ rideId, passengerId: userId, status: "confirmed" });
    if (!booking) {
      return res.status(403).json({ message: "You are not a passenger on this ride." });
    }

    ride.confirmByPassenger = true;
    await ride.save();

    // Check if both have confirmed
    if (ride.confirmByDriver && ride.confirmByPassenger) {
      ride.status = "completed";
      ride.completedAt = new Date();
      ride.isTrackingLocation = false;
      await ride.save();

      // Notify both parties that ride is completed
      global.io.emit("ride_completed", {
        rideId: ride._id,
        status: "completed",
      });

      const bookings = await Booking.find({ rideId, status: "confirmed" });
      bookings.forEach((b) => {
        global.io.to(`user_${b.passengerId}`).emit("ride_completed", {
          rideId: ride._id,
          status: "completed",
        });
      });
      global.io.to(`user_${ride.driverId}`).emit("ride_completed", {
        rideId: ride._id,
        status: "completed",
      });
    } else {
      // Notify driver that passenger has confirmed
      global.io.to(`user_${ride.driverId}`).emit("passenger_confirmed_completion", {
        rideId: ride._id,
      });
    }

    res.json({ 
      success: true, 
      confirmByDriver: ride.confirmByDriver,
      confirmByPassenger: true,
      isCompleted: ride.confirmByDriver && ride.confirmByPassenger
    });
  } catch (err) {
    console.error("Passenger confirmation error:", err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/rides/:id/remaining-payment — Create order for remaining payment
router.post("/:id/remaining-payment", protect, async (req, res) => {
  const { createRemainingPaymentOrder } = require("../services/paymentService");
  const rideId = req.params.id;
  const userId = req.user._id;

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found." });

    // Check if user is a passenger on this ride
    const booking = await Booking.findOne({ rideId, passengerId: userId, status: "confirmed" });
    if (!booking) {
      return res.status(403).json({ message: "You are not a passenger on this ride." });
    }

    if (ride.paymentStatus !== "PARTIAL_PAID") {
      return res.status(400).json({ message: "Ride payment status is not eligible for remaining payment." });
    }

    const order = await createRemainingPaymentOrder(rideId, userId);
    res.json(order);
  } catch (err) {
    console.error("Create remaining payment order error:", err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/rides/:id/remaining-payment/verify — Verify remaining payment
router.post("/:id/remaining-payment/verify", protect, async (req, res) => {
  const { processRemainingPayment } = require("../services/paymentService");
  const rideId = req.params.id;
  const userId = req.user._id;
  const { paymentId, signature } = req.body;

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found." });

    // Check if user is a passenger on this ride
    const booking = await Booking.findOne({ rideId, passengerId: userId, status: "confirmed" });
    if (!booking) {
      return res.status(403).json({ message: "You are not a passenger on this ride." });
    }

    const result = await processRemainingPayment(rideId, paymentId, signature, userId);
    res.json({ success: true, ride: result.ride, driverEarning: result.driverEarning });
  } catch (err) {
    console.error("Verify remaining payment error:", err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/rides/:id/remaining-payment/cash — Process cash payment
router.post("/:id/remaining-payment/cash", protect, async (req, res) => {
  const { calculatePaymentAmounts } = require("../services/paymentService");
  const { UPFRONT_PERCENTAGE, COMMISSION_PERCENTAGE } = require("../services/paymentService");
  const rideId = req.params.id;
  const userId = req.user._id;

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found." });

    // Check if user is a passenger on this ride
    const booking = await Booking.findOne({ rideId, passengerId: userId, status: "confirmed" });
    if (!booking) {
      return res.status(403).json({ message: "You are not a passenger on this ride." });
    }

    if (ride.paymentStatus !== "PARTIAL_PAID") {
      return res.status(400).json({ message: "Ride payment status is not eligible for remaining payment." });
    }

    // Calculate payment amounts
    const { baseFare, totalFare, driverEarning } = calculatePaymentAmounts(ride.totalFare || ride.pricePerSeat * booking.seats);

    // Update ride payment status as cash paid
    ride.paymentStatus = "FULL_PAID";
    ride.paymentMethod = "cash";
    ride.driverEarning = driverEarning;
    ride.completedAt = new Date();
    ride.status = "completed";
    await ride.save();

    // Add to driver's pending balance
    const Wallet = require("../models/Wallet");
    const Transaction = require("../models/Transaction");
    
    let wallet = await Wallet.findOne({ userId: ride.driverId });
    if (!wallet) {
      wallet = await Wallet.create({ userId: ride.driverId });
    }
    wallet.pendingBalance += driverEarning;
    wallet.totalEarnings += driverEarning;
    await wallet.save();

    // Create pending transaction for driver
    await Transaction.create({
      userId: ride.driverId,
      rideId,
      type: "PENDING_CREDIT",
      amount: driverEarning,
      description: "Driver earning (cash payment - pending release)",
      status: "PENDING",
      metadata: {
        driverEarning,
        paymentMethod: "cash",
      },
    });

    // Create transaction for passenger
    await Transaction.create({
      userId,
      rideId,
      type: "CREDIT",
      amount: totalFare,
      description: "Cash payment for completed ride",
      status: "COMPLETED",
      metadata: {
        paymentMethod: "cash",
      },
    });

    res.json({ success: true, ride, driverEarning });
  } catch (err) {
    console.error("Cash payment error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

// POST /api/rides/:id/deviation-charge — Driver requests extra charge for route deviation
router.post("/:id/deviation-charge", protect, restrictTo("driver"), async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: "Ride not found." });
    if (String(ride.driverId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Only the driver can request deviation charge." });
    }
    if (ride.status !== "active") {
      return res.status(400).json({ message: "Ride is not active." });
    }
    if (ride.deviationChargeRequested) {
      return res.status(400).json({ message: "Deviation charge already requested." });
    }

    const { deviationDistance } = req.body;
    if (!deviationDistance || deviationDistance <= 0) {
      return res.status(400).json({ message: "Valid deviation distance is required." });
    }

    // Calculate extra charge (₹20 per km)
    const extraCharge = deviationDistance * 20;

    ride.deviationDistance = deviationDistance;
    ride.extraCharge = extraCharge;
    ride.deviationChargeRequested = true;
    await ride.save();

    // Notify passengers about deviation charge request
    const bookings = await Booking.find({ rideId: ride._id, status: "confirmed" });
    bookings.forEach((booking) => {
      global.io.to(`user_${booking.passengerId}`).emit("deviation_charge_requested", {
        rideId: ride._id,
        deviationDistance,
        extraCharge,
        message: `Driver has requested ₹${extraCharge} extra charge for ${deviationDistance} km route deviation.`
      });
    });

    res.json({
      success: true,
      deviationDistance,
      extraCharge,
      message: `Deviation charge of ₹${extraCharge} requested for ${deviationDistance} km deviation.`
    });
  } catch (err) {
    console.error("Deviation charge request error:", err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/rides/:id/deviation-charge/approve — Passenger approves deviation charge
router.post("/:id/deviation-charge/approve", protect, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: "Ride not found." });
    if (ride.status !== "active") {
      return res.status(400).json({ message: "Ride is not active." });
    }
    if (!ride.deviationChargeRequested) {
      return res.status(400).json({ message: "No deviation charge requested." });
    }
    if (ride.deviationChargeApproved) {
      return res.status(400).json({ message: "Deviation charge already approved." });
    }

    // Check if user is a passenger on this ride
    const booking = await Booking.findOne({ rideId: ride._id, passengerId: req.user._id, status: "confirmed" });
    if (!booking) {
      return res.status(403).json({ message: "You are not a passenger on this ride." });
    }

    ride.deviationChargeApproved = true;
    await ride.save();

    // Notify driver about approval
    global.io.to(`user_${ride.driverId}`).emit("deviation_charge_approved", {
      rideId: ride._id,
      extraCharge: ride.extraCharge,
      message: `Passenger approved deviation charge of ₹${ride.extraCharge}.`
    });

    // Notify other passengers
    const bookings = await Booking.find({ rideId: ride._id, status: "confirmed" });
    bookings.forEach((b) => {
      global.io.to(`user_${b.passengerId}`).emit("deviation_charge_approved", {
        rideId: ride._id,
        extraCharge: ride.extraCharge,
        message: `Deviation charge of ₹${ride.extraCharge} has been approved.`
      });
    });

    res.json({
      success: true,
      extraCharge: ride.extraCharge,
      message: "Deviation charge approved successfully."
    });
  } catch (err) {
    console.error("Deviation charge approval error:", err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/rides/:id/deviation-charge/reject — Passenger rejects deviation charge
router.post("/:id/deviation-charge/reject", protect, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: "Ride not found." });
    if (ride.status !== "active") {
      return res.status(400).json({ message: "Ride is not active." });
    }
    if (!ride.deviationChargeRequested) {
      return res.status(400).json({ message: "No deviation charge requested." });
    }

    // Check if user is a passenger on this ride
    const booking = await Booking.findOne({ rideId: ride._id, passengerId: req.user._id, status: "confirmed" });
    if (!booking) {
      return res.status(403).json({ message: "You are not a passenger on this ride." });
    }

    // Reset deviation charge
    ride.deviationDistance = 0;
    ride.extraCharge = 0;
    ride.deviationChargeRequested = false;
    ride.deviationChargeApproved = false;
    await ride.save();

    // Notify driver about rejection
    global.io.to(`user_${ride.driverId}`).emit("deviation_charge_rejected", {
      rideId: ride._id,
      message: "Passenger rejected deviation charge request."
    });

    // Notify other passengers
    const bookings = await Booking.find({ rideId: ride._id, status: "confirmed" });
    bookings.forEach((b) => {
      global.io.to(`user_${b.passengerId}`).emit("deviation_charge_rejected", {
        rideId: ride._id,
        message: "Deviation charge request has been rejected."
      });
    });

    res.json({
      success: true,
      message: "Deviation charge rejected successfully."
    });
  } catch (err) {
    console.error("Deviation charge rejection error:", err);
    res.status(500).json({ message: err.message });
  }
});

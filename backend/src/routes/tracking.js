const express = require("express");
const Ride = require("../models/Ride");
const RideLocation = require("../models/RideLocation");
const Booking = require("../models/Booking");
const { protect } = require("../middleware/auth");
const { notifyRidePassengers } = require("../services/notificationService");

const router = express.Router();

/**
 * POST /api/tracking/:rideId/start — driver starts live tracking for a ride
 */
router.post("/:rideId/start", protect, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    if (ride.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the ride driver can start tracking" });
    }
    if (ride.status !== "active") {
      return res.status(400).json({ message: "Ride is not active" });
    }

    ride.liveTracking = {
      isActive: true,
      startedAt: new Date(),
      endedAt: null,
    };
    await ride.save();

    // Notify ride room + passengers
    global.io.to(`ride_${ride._id}`).emit("ride_tracking_started", { rideId: ride._id });

    await notifyRidePassengers(ride._id, {
      title: "Ride Started 🚗",
      body: "Your driver has started the trip. Track them live!",
      data: { type: "ride_started", rideId: ride._id.toString() },
    });

    res.json({ success: true, liveTracking: ride.liveTracking });
  } catch (err) {
    console.error("Start tracking error:", err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/tracking/:rideId/stop — driver stops live tracking
 */
router.post("/:rideId/stop", protect, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    if (ride.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the ride driver can stop tracking" });
    }

    ride.liveTracking = {
      isActive: false,
      startedAt: ride.liveTracking?.startedAt || null,
      endedAt: new Date(),
    };
    await ride.save();

    // Clear the stored location
    await RideLocation.deleteOne({ rideId: ride._id });

    global.io.to(`ride_${ride._id}`).emit("ride_tracking_stopped", { rideId: ride._id });

    res.json({ success: true, liveTracking: ride.liveTracking });
  } catch (err) {
    console.error("Stop tracking error:", err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/tracking/:rideId/location — get the latest driver location for a ride
 * Accessible by the driver and any passenger who booked the ride.
 */
router.get("/:rideId/location", protect, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId).lean();
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    const isDriver = ride.driverId.toString() === req.user._id.toString();
    let isPassenger = false;
    if (!isDriver) {
      const booking = await Booking.findOne({
        rideId: ride._id,
        passengerId: req.user._id,
        status: "confirmed",
      }).lean();
      isPassenger = !!booking;
    }

    if (!isDriver && !isPassenger) {
      return res.status(403).json({ message: "Not authorized to track this ride" });
    }

    const location = await RideLocation.findOne({ rideId: ride._id }).lean();

    res.json({
      isTracking: ride.liveTracking?.isActive || false,
      startedAt: ride.liveTracking?.startedAt || null,
      location: location
        ? {
            lat: location.lat,
            lng: location.lng,
            speed: location.speed,
            heading: location.heading,
            updatedAt: location.updatedAt,
          }
        : null,
    });
  } catch (err) {
    console.error("Get location error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

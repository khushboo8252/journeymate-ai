const express = require("express");
const { body, validationResult } = require("express-validator");
const Ride = require("../models/Ride");
const Booking = require("../models/Booking");
const { protect } = require("../middleware/auth");

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
      .populate("driverId", "fullName avatarUrl phone")
      .lean();
    if (!ride) return res.status(404).json({ message: "Ride not found." });
    res.json(ride);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/rides — create ride
router.post(
  "/",
  protect,
  [
    body("origin").trim().isLength({ min: 2 }).withMessage("Origin is required"),
    body("destination").trim().isLength({ min: 2 }).withMessage("Destination is required"),
    body("departureAt").isISO8601().withMessage("Valid departure date/time required"),
    body("seatsTotal").isInt({ min: 1, max: 8 }).withMessage("Seats must be between 1 and 8"),
    body("pricePerSeat").isFloat({ min: 1 }).withMessage("Price must be at least ₹1"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { origin, destination, departureAt, seatsTotal, pricePerSeat, description } = req.body;

    try {
      const ride = await Ride.create({
        driverId: req.user._id,
        origin,
        destination,
        departureAt: new Date(departureAt),
        seatsTotal: Number(seatsTotal),
        seatsAvailable: Number(seatsTotal),
        pricePerSeat: Number(pricePerSeat),
        description: description || null,
      });
      res.status(201).json(ride);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// PATCH /api/rides/:id/cancel — driver cancels ride
router.patch("/:id/cancel", protect, async (req, res) => {
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

    await Booking.updateMany(
      { rideId: ride._id, status: "confirmed" },
      { status: "cancelled" }
    );

    res.json(ride);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

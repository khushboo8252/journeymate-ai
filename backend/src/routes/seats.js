const express = require('express');
const router = express.Router();
const Seat = require('../models/Seat');
const Ride = require('../models/Ride');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');

/**
 * GET /api/rides/:rideId/seats
 * Get all seats for a ride with their current status
 */
router.get('/rides/:rideId/seats', protect, async (req, res) => {
  try {
    const { rideId } = req.params;
    const userId = req.user._id;

    // Verify ride exists
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Get all seats for this ride
    let seats = await Seat.find({ rideId }).sort({ row: 1, position: 1 });

    // If no seats exist, this is an old ride - generate default seats for backward compatibility
    if (seats.length === 0) {
      const { generateSeats } = require('../utils/seatGenerator');
      const seatData = generateSeats(rideId, ride.vehicleType || 'sedan');
      await Seat.insertMany(seatData);
      seats = await Seat.find({ rideId }).sort({ row: 1, position: 1 });
    }

    // Populate passenger details for booked seats
    const seatsWithPassengers = await Promise.all(
      seats.map(async (seat) => {
        const seatObj = seat.toObject();
        if (seat.status === 'booked' && seat.bookedBy) {
          const passenger = await User.findById(seat.bookedBy)
            .select('fullName phone avatarUrl');
          seatObj.passenger = passenger;
        }
        // Check if seat is locked by current user
        if (seat.status === 'locked' && seat.lockedBy?.toString() === userId.toString()) {
          seatObj.isMyLock = true;
        }
        return seatObj;
      })
    );

    res.json(seatsWithPassengers);
  } catch (error) {
    console.error('Error fetching seats:', error);
    res.status(500).json({ error: 'Failed to fetch seats' });
  }
});

/**
 * POST /api/rides/:rideId/seats/lock
 * Lock specific seats for a user (5-minute lock)
 */
router.post('/rides/:rideId/seats/lock', protect, async (req, res) => {
  try {
    const { rideId } = req.params;
    const { seatNumbers } = req.body;
    const userId = req.user._id;
    const io = global.io;

    console.log(`Seat lock request - Ride: ${rideId}, User: ${userId}, Seats: ${JSON.stringify(seatNumbers)}`);

    if (!seatNumbers || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      console.log('Seat lock failed: Seat numbers are required');
      return res.status(400).json({ error: 'Seat numbers are required' });
    }

    // Verify ride exists and is active
    const ride = await Ride.findById(rideId);
    if (!ride) {
      console.log(`Seat lock failed: Ride not found - ${rideId}`);
      return res.status(404).json({ error: 'Ride not found' });
    }
    console.log(`Ride status: ${ride.status}, Driver: ${ride.driverId}`);
    if (ride.status !== 'active') {
      console.log(`Seat lock failed: Ride is not active - status is ${ride.status}`);
      return res.status(400).json({ error: 'Ride is not active' });
    }

    // Check if user is the driver
    if (ride.driverId.toString() === userId.toString()) {
      console.log(`Seat lock failed: Driver cannot book their own ride`);
      return res.status(400).json({ error: 'Driver cannot book their own ride' });
    }

    // Release any existing locks by this user on this ride
    await Seat.releaseSeats(rideId, [], userId);

    // Lock the requested seats atomically using findOneAndUpdate (2 minutes for IRCTC-style UX)
    const result = await Seat.lockSeats(rideId, seatNumbers, userId, 2);

    if (result.failedSeats.length > 0) {
      // Some seats were already locked or booked by other users
      console.log(`Seat lock failed for seats: ${result.failedSeats.join(', ')}`);
      return res.status(400).json({
        error: 'Some seats are not available',
        failedSeats: result.failedSeats,
        lockedSeats: result.lockedSeats.map(s => s.seatNumber)
      });
    }

    // Emit socket event for real-time update
    io.to(`ride_${rideId}`).emit('seat_locked', {
      rideId,
      seatNumbers: result.lockedSeats.map(s => s.seatNumber),
      lockedBy: userId,
      lockedUntil: result.lockedUntil
    });

    res.json({
      success: true,
      seatNumbers: result.lockedSeats.map(s => s.seatNumber),
      lockedUntil: result.lockedUntil
    });
  } catch (error) {
    console.error('Error locking seats:', error);
    res.status(500).json({ error: 'Failed to lock seats' });
  }
});

/**
 * POST /api/rides/:rideId/seats/release
 * Release locked seats
 */
router.post('/rides/:rideId/seats/release', protect, async (req, res) => {
  try {
    const { rideId } = req.params;
    const { seatNumbers } = req.body;
    const userId = req.user._id;
    const io = global.io;

    if (!seatNumbers || !Array.isArray(seatNumbers)) {
      return res.status(400).json({ error: 'Seat numbers are required' });
    }

    // Release seats locked by this user
    const result = await Seat.releaseSeats(rideId, seatNumbers, userId);

    // Emit socket event for real-time update
    if (result.modifiedCount > 0) {
      io.to(`ride_${rideId}`).emit('seat_released', {
        rideId,
        seatNumbers
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error releasing seats:', error);
    res.status(500).json({ error: 'Failed to release seats' });
  }
});

/**
 * GET /api/rides/:rideId/seats/passengers
 * Get passenger-seat mapping (for drivers) - returns all seats with status
 */
router.get('/rides/:rideId/seats/passengers', protect, async (req, res) => {
  try {
    const { rideId } = req.params;
    const userId = req.user._id;

    // Verify ride exists and user is the driver
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }
    if (ride.driverId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Only the driver can view passenger details' });
    }

    // Get all seats for this ride
    let seats = await Seat.find({ rideId }).sort({ row: 1, position: 1 });

    // If no seats exist, generate default seats for backward compatibility
    if (seats.length === 0) {
      const { generateSeats } = require('../utils/seatGenerator');
      const seatData = generateSeats(rideId, ride.vehicleType || 'sedan');
      await Seat.insertMany(seatData);
      seats = await Seat.find({ rideId }).sort({ row: 1, position: 1 });
    }

    // Populate passenger details for booked seats
    const seatsWithPassengers = await Promise.all(
      seats.map(async (seat) => {
        const seatObj = seat.toObject();
        if (seat.status === 'booked' && seat.bookedBy) {
          const passenger = await User.findById(seat.bookedBy)
            .select('fullName phone avatarUrl');
          seatObj.passenger = passenger;
        }
        return seatObj;
      })
    );

    res.json({
      rideId,
      vehicleType: ride.vehicleType,
      totalSeats: ride.seatsTotal,
      seats: seatsWithPassengers
    });
  } catch (error) {
    console.error('Error fetching passenger mapping:', error);
    res.status(500).json({ error: 'Failed to fetch passenger details' });
  }
});

module.exports = router;

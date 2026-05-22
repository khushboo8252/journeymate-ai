const Seat = require('../models/Seat');

/**
 * Cron job to release expired seat locks
 * This should run every minute to clean up expired locks
 */
const releaseExpiredLocks = async (io) => {
  try {
    // Find and release all expired locks
    const result = await Seat.releaseExpiredLocks();
    
    if (result.modifiedCount > 0) {
      console.log(`🔓 Released ${result.modifiedCount} expired seat locks`);
      
      // Get the expired seats to notify users
      const expiredSeats = await Seat.find({
        status: 'available',
        lockedAt: { $ne: null }
      }).select('rideId seatNumber lockedBy');
      
      // Group by ride and user to send notifications
      const notifications = {};
      expiredSeats.forEach(seat => {
        const key = `${seat.rideId}_${seat.lockedBy}`;
        if (!notifications[key]) {
          notifications[key] = {
            rideId: seat.rideId,
            userId: seat.lockedBy,
            seatNumbers: []
          };
        }
        notifications[key].seatNumbers.push(seat.seatNumber);
      });
      
      // Notify users whose locks expired
      Object.values(notifications).forEach(({ rideId, userId, seatNumbers }) => {
        if (io && userId) {
          io.to(`user_${userId}`).emit('seat_lock_expired', {
            rideId,
            seatNumbers
          });
        }
        // Also broadcast to ride room so other users see seats available
        if (io && rideId) {
          io.to(`ride_${rideId}`).emit('seat_released', {
            rideId,
            seatNumbers
          });
        }
      });
    }
  } catch (error) {
    console.error('Error releasing expired locks:', error);
  }
};

module.exports = { releaseExpiredLocks };

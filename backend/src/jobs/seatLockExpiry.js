const Seat = require('../models/Seat');

/**
 * Cron job to release expired seat locks
 * Runs every minute to clean up expired locks and notify real-time clients
 */
const releaseExpiredLocks = async (io) => {
  try {
    const now = new Date();

    // 🚨 STEP 1: Pehle un seats ko FIND karo jo expire ho chuki hain (LOCK release karne se pehle)
    const expiredSeats = await Seat.find({
      status: 'locked',
      lockedUntil: { $lt: now }
    }).select('_id rideId seatNumber lockedBy');

    // Agar koi seat expire nahi hui hai, toh chupchaap return ho jao (Save CPU/RAM)
    if (expiredSeats.length === 0) {
      return; 
    }

    const expiredSeatIds = expiredSeats.map(seat => seat._id);

    // 🚨 STEP 2: Ab un seats ko database me CLEAN release karo (Metadata null karna zaroori hai taaki spam na ho)
    const result = await Seat.updateMany(
      { _id: { $in: expiredSeatIds } },
      {
        $set: {
          status: 'available',
          lockedBy: null,
          lockedAt: null,
          lockedUntil: null
        }
      }
    );

    console.log(`🔓 Released ${result.modifiedCount} expired seat locks`);

    // 🚨 STEP 3: Notifications group karo ride aur user ke hisaab se
    const notifications = {};
    expiredSeats.forEach(seat => {
      if (!seat.lockedBy) return;
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

    // 🚨 STEP 4: Exact users aur live rooms ko socket notification bhej do
    Object.values(notifications).forEach(({ rideId, userId, seatNumbers }) => {
      if (io && userId) {
        // Jis user ka 2 minute ka time expire hua hai, usko alert do
        io.to(`user_${userId}`).emit('seat_lock_expired', {
          rideId,
          seatNumbers,
          message: "Aapka seat hold expire ho gaya hai."
        });
      }
      if (io && rideId) {
        // Baaki sabhi logon ko dikha do ki ye seats wapas green (available) ho gayi hain
        io.to(`ride_${rideId}`).emit('seat_released', {
          rideId,
          seatNumbers
        });
      }
    });

  } catch (error) {
    console.error('Error releasing expired locks:', error);
  }
};

module.exports = { releaseExpiredLocks };
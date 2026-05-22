const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  rideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    required: true,
    index: true
  },
  seatNumber: {
    type: String, // e.g., "A1", "A2", "B1", "C1"
    required: true
  },
  row: {
    type: String, // e.g., "A", "B", "C"
    required: true
  },
  position: {
    type: Number, // 1, 2, 3... in the row
    required: true
  },
  type: {
    type: String,
    enum: ['driver', 'passenger', 'window', 'middle'],
    default: 'passenger'
  },
  status: {
    type: String,
    enum: ['available', 'booked', 'locked'],
    default: 'available',
    index: true
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  lockedAt: {
    type: Date,
    default: null
  },
  lockedUntil: {
    type: Date,
    default: null,
    index: true
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
seatSchema.index({ rideId: 1, status: 1 });
seatSchema.index({ rideId: 1, seatNumber: 1 }, { unique: true });

// Note: lockedUntil is already indexed in the schema definition above
// No need for duplicate index here

// Method to check if seat is available for booking
seatSchema.methods.isAvailable = function() {
  return this.status === 'available';
};

// Method to check if seat is locked by a specific user
seatSchema.methods.isLockedBy = function(userId) {
  return this.status === 'locked' && this.lockedBy?.toString() === userId.toString();
};

// Method to check if lock has expired
seatSchema.methods.hasLockExpired = function() {
  if (this.status !== 'locked' || !this.lockedUntil) return false;
  return new Date() > this.lockedUntil;
};

// Static method to lock seats atomically using findOneAndUpdate
// This prevents race conditions by checking status === 'available' in the same operation
seatSchema.statics.lockSeats = async function(rideId, seatNumbers, userId, lockDurationMinutes = 5) {
  const lockedUntil = new Date(Date.now() + lockDurationMinutes * 60 * 1000);
  const lockedSeats = [];
  const failedSeats = [];

  // Lock each seat atomically using findOneAndUpdate
  // This ensures only one user can lock a seat at a time
  for (const seatNumber of seatNumbers) {
    const result = await this.findOneAndUpdate(
      {
        rideId,
        seatNumber,
        status: 'available' // CRITICAL: Only lock if seat is available
      },
      {
        $set: {
          status: 'locked',
          lockedBy: userId,
          lockedAt: new Date(),
          lockedUntil: lockedUntil
        }
      },
      { new: true } // Return the updated document
    );

    if (result) {
      lockedSeats.push(result);
    } else {
      // Seat was not available (already locked or booked)
      failedSeats.push(seatNumber);
    }
  }

  return {
    lockedSeats,
    failedSeats,
    lockedUntil
  };
};

// Static method to release locked seats
seatSchema.statics.releaseSeats = async function(rideId, seatNumbers, userId) {
  const result = await this.updateMany(
    {
      rideId,
      seatNumber: { $in: seatNumbers },
      status: 'locked',
      lockedBy: userId
    },
    {
      $set: {
        status: 'available',
        lockedBy: null,
        lockedAt: null,
        lockedUntil: null
      }
    }
  );
  
  return result;
};

// Static method to book seats
seatSchema.statics.bookSeats = async function(rideId, seatNumbers, userId, bookingId) {
  const result = await this.updateMany(
    {
      rideId,
      seatNumber: { $in: seatNumbers },
      status: 'locked',
      lockedBy: userId
    },
    {
      $set: {
        status: 'booked',
        bookedBy: userId,
        bookingId: bookingId,
        lockedBy: null,
        lockedAt: null,
        lockedUntil: null
      }
    }
  );
  
  return result;
};

// Static method to release seats when booking is cancelled
seatSchema.statics.releaseBookedSeats = async function(rideId, seatNumbers) {
  const result = await this.updateMany(
    {
      rideId,
      seatNumber: { $in: seatNumbers },
      status: 'booked'
    },
    {
      $set: {
        status: 'available',
        bookedBy: null,
        bookingId: null
      }
    }
  );
  
  return result;
};

// Static method to release expired locks
seatSchema.statics.releaseExpiredLocks = async function() {
  const result = await this.updateMany(
    {
      status: 'locked',
      lockedUntil: { $lt: new Date() }
    },
    {
      $set: {
        status: 'available',
        lockedBy: null,
        lockedAt: null,
        lockedUntil: null
      }
    }
  );
  
  return result;
};

// Static method to get seat counts by status
seatSchema.statics.getSeatCounts = async function(rideId) {
  const counts = await this.aggregate([
    { $match: { rideId: new mongoose.Types.ObjectId(rideId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  
  const result = {
    total: 0,
    available: 0,
    booked: 0,
    locked: 0
  };
  
  counts.forEach(c => {
    result[c._id] = c.count;
    result.total += c.count;
  });
  
  return result;
};

module.exports = mongoose.model('Seat', seatSchema);

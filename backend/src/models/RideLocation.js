const mongoose = require("mongoose");

/**
 * RideLocation — stores the LATEST live GPS location of a driver during an active ride.
 * We use upsert (one doc per ride) so we never bloat the DB with every GPS point.
 */
const rideLocationSchema = new mongoose.Schema(
  {
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
      unique: true, // one latest-location doc per ride
      index: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    speed: {
      type: Number,
      default: 0, // metres/second from Geolocation API
    },
    heading: {
      type: Number,
      default: null, // degrees from north
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RideLocation", rideLocationSchema);

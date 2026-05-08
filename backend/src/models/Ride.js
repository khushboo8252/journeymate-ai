const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    origin: {
      type: String,
      required: [true, "Origin is required"],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, "Destination is required"],
      trim: true,
    },
    departureAt: {
      type: Date,
      required: [true, "Departure date/time is required"],
    },
    seatsTotal: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
      default: 3,
    },
    seatsAvailable: {
      type: Number,
      required: true,
      min: 0,
    },
    pricePerSeat: {
      type: Number,
      required: [true, "Price per seat is required"],
      min: 1,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true }
);

rideSchema.index({ origin: "text", destination: "text" });
rideSchema.index({ departureAt: 1, status: 1 });

module.exports = mongoose.model("Ride", rideSchema);

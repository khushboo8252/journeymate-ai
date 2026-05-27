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
    arrivalAt: {
      type: Date,
      default: null,
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
    vehicleType: {
      type: String,
      enum: ["hatchback", "sedan", "suv", "mpv", "van"],
      default: "sedan",
    },
    // Payment fields
    totalFare: {
      type: Number,
      default: 0,
    },
    upfrontPaid: {
      type: Number,
      default: 0,
    },
    remainingAmount: {
      type: Number,
      default: 0,
    },
    commissionPercent: {
      type: Number,
      default: 10,
    },
    driverEarning: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PARTIAL_PAID", "FULL_PAID", "RELEASED"],
      default: "PENDING",
    },
    razorpayOrderId: {
      type: String,
      default: null,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    payoutReleaseAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

rideSchema.index({ origin: "text", destination: "text" });
rideSchema.index({ departureAt: 1, status: 1 });

module.exports = mongoose.model("Ride", rideSchema);

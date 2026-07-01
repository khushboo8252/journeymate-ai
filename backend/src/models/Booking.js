const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
    },
    passengerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seats: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    seatNumbers: {
      type: [String],
      default: [],
    },
    // ✅ NAYA FEATURE: Pickup Point add kar diya (Optional)
    pickupPoint: {
      type: String,
      default: null,
      trim: true,
    },
    // 🚨 YAHAN ADD KIYE HAIN HUMARE NAYE FIELDS 🚨
    deviationCharge: {
      type: Number,
      default: 0,
    },
    driverCashFare: {
      type: Number,
      default: 0,
    },
    isPaymentConfirmedByDriver: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending_payment", "confirmed", "cancelled"],
      default: "pending_payment",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
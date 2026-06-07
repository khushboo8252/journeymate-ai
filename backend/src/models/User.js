const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["driver", "passenger"],
      default: "passenger",
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    phone: {
      type: String,
      default: null,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    avatarPublicId: {
      type: String,
      default: null,
    },
    vehicleSeats: {
      type: Number,
      min: 1,
      max: 8,
      default: null,
    },
    vehicleNumber: {
      type: String,
      default: null,
    },
    earnings: {
      type: Number,
      default: 0,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    hasSeenApprovalNotification: {
      type: Boolean,
      default: false,
    },
    // Driver verification documents
    drivingLicense: {
      frontUrl: { type: String, default: null },
      frontPublicId: { type: String, default: null },
      backUrl: { type: String, default: null },
      backPublicId: { type: String, default: null },
    },
    aadharCard: {
      frontUrl: { type: String, default: null },
      frontPublicId: { type: String, default: null },
      backUrl: { type: String, default: null },
      backPublicId: { type: String, default: null },
    },
    panCard: {
      frontUrl: { type: String, default: null },
      frontPublicId: { type: String, default: null },
    },
    rc: {
      frontUrl: { type: String, default: null },
      frontPublicId: { type: String, default: null },
      backUrl: { type: String, default: null },
      backPublicId: { type: String, default: null },
    },
    vehicleImage: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
    },
    bankAccountNumber: {
      type: String,
      default: null,
      select: false,
    },
    ifscCode: {
      type: String,
      default: null,
      select: false,
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
    // Firebase Cloud Messaging device tokens for push notifications
    fcmTokens: {
      type: [String],
      default: [],
    },
    passwordChangedAt: {
      type: Date,
      select: false,
    },
    // Ride cancellation tracking
    rideCancellationCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Compare plain password against hashed
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Returns user object without sensitive fields
userSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordChangedAt;
  if (!obj.role) obj.role = "passenger";
  if (obj.isProfileComplete === undefined) obj.isProfileComplete = false;
  return obj;
};

// Check if password was changed after a JWT was issued
userSchema.methods.changedPasswordAfter = function (jwtIssuedAt) {
  if (this.passwordChangedAt) {
    const changedAt = Math.floor(this.passwordChangedAt.getTime() / 1000);
    return jwtIssuedAt < changedAt;
  }
  return false;
};

module.exports = mongoose.model("User", userSchema);

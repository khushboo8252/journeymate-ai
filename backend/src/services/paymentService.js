const Ride = require("../models/Ride");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const { createOrder, verifyPayment, fetchPayment, createPayout } = require("../utils/razorpay");
const { payoutQueue } = require("../config/queue");

// 🚨 [UPDATED CONSTANTS]: Aligned strictly with your business logic
const COMMISSION_PERCENTAGE = 0.05; // 5% platform commission
const UPFRONT_PERCENTAGE = 0.0952;  // ~9.52% upfront payment (app ke paas aayega)
const PAYOUT_DELAY_HOURS = 3; 

/**
 * Calculate payment amounts for a ride
 * Math Example: If driver sets 100rs base fare:
 * totalBaseFare = 100
 * platformFee = 5 (5%)
 * totalFare = 105 (Passenger ko dikhega)
 * upfrontAmount = 10 (Razorpay par seat book hogi)
 * remainingAmount = 95 (Passenger driver ko direct UPI/Cash dega)
 * driverEarning = 5 (Admin ledger me add hoga jo driver ko wapas dena hai)
 */
const calculatePaymentAmounts = (baseFare) => {
  const totalBaseFare = Number(baseFare);
  
  // 1. Platform fee (5%)
  const platformFee = Math.round(totalBaseFare * COMMISSION_PERCENTAGE); 
  
  // 2. Total fare shown to the passenger
  const totalFare = totalBaseFare + platformFee;
  
  // 3. Upfront amount paid on the app via Razorpay (9.52% of totalFare)
  const upfrontAmount = Math.round(totalFare * UPFRONT_PERCENTAGE);
  
  // 4. Amount passenger will hand over to driver directly via Cash/UPI
  const remainingAmount = totalFare - upfrontAmount;
  
  // 5. Amount platform owes the driver (Saved in Admin Ledger/Wallet)
  // Math: 100 (Base) - 95 (Cash received) = 5 (Owed to driver)
  const driverEarning = totalBaseFare - remainingAmount; 

  return {
    baseFare: totalBaseFare,
    platformFee,
    totalFare,
    upfrontAmount,
    remainingAmount, // Passenger direct driver ko dega
    driverEarning,   // Admin panel me dikhega manual refund ke liye
  };
};

/**
 * Create upfront payment order for booking
 */
const createUpfrontPaymentOrder = async (rideId, userId, seatsBooked = 1) => {
  try {
    const ride = await Ride.findById(rideId);
    if (!ride) {
      throw new Error("Ride not found");
    }

    // Calculate total fare based on seats actually booked
    const totalFareForSeats = ride.pricePerSeat * seatsBooked;
    const { upfrontAmount, remainingAmount, driverEarning } = calculatePaymentAmounts(totalFareForSeats);

    // Update ride with payment details
    ride.totalFare = totalFareForSeats;
    ride.upfrontPaid = 0;
    ride.remainingAmount = remainingAmount;
    ride.driverEarning = driverEarning;
    await ride.save();

    // Create Razorpay order
    const receipt = `ride_${rideId}_upfront`;
    const order = await createOrder(upfrontAmount, receipt, {
      userId,
      rideId,
      type: "upfront",
    });

    // Update ride with Razorpay order ID
    ride.razorpayOrderId = order.id;
    await ride.save();

    return {
      orderId: order.id,
      amount: upfrontAmount,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  } catch (error) {
    console.error("Create upfront payment order error:", error);
    throw error;
  }
};

/**
 * Verify and process upfront payment
 */
const processUpfrontPayment = async (rideId, paymentId, signature, userId) => {
  try {
    const ride = await Ride.findById(rideId);
    if (!ride) {
      throw new Error("Ride not found");
    }

    if (ride.razorpayOrderId) {
      const isValid = verifyPayment(ride.razorpayOrderId, paymentId, signature);
      if (!isValid) {
        throw new Error("Invalid payment signature");
      }
    }

    // Fetch payment details
    const payment = await fetchPayment(paymentId);
    if (payment.status !== "captured") {
      throw new Error("Payment not captured");
    }

    // 🚨 [FIXED]: Exact upfront amount dynamically check karke save hoga, ab 0 save nahi hoga
    const { upfrontAmount } = calculatePaymentAmounts(ride.totalFare || ride.pricePerSeat);

    // Update ride payment status
    ride.razorpayPaymentId = paymentId;
    ride.upfrontPaid = upfrontAmount; 
    ride.paymentStatus = "PARTIAL_PAID";
    await ride.save();

    // Create transaction record
    await Transaction.create({
      userId,
      rideId,
      type: "CREDIT",
      amount: upfrontAmount,
      description: "Upfront payment for ride booking",
      status: "COMPLETED",
      razorpayPaymentId: paymentId,
      razorpayOrderId: ride.razorpayOrderId,
    });

    return { success: true, ride };
  } catch (error) {
    console.error("Process upfront payment error:", error);
    throw error;
  }
};

/**
 * Create order for remaining payment (Kept for routing safety, but logic is simplified)
 */
const createRemainingPaymentOrder = async (rideId, userId) => {
  try {
    const ride = await Ride.findById(rideId);
    if (!ride) throw new Error("Ride not found");

    const remainingAmount = ride.remainingAmount;
    const receipt = `ride_${rideId}_remaining`;
    const order = await createOrder(remainingAmount, receipt, {
      userId,
      rideId,
      type: "remaining",
    });

    return {
      orderId: order.id,
      amount: remainingAmount,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  } catch (error) {
    console.error("Create remaining payment order error:", error);
    throw error;
  }
};

/**
 * Process remaining payment (Kept for backward compatibility)
 */
const processRemainingPayment = async (rideId, paymentId, signature, userId) => {
  try {
    const ride = await Ride.findById(rideId).populate("driverId");
    if (!ride) throw new Error("Ride not found");

    const { driverEarning } = calculatePaymentAmounts(ride.totalFare);

    ride.razorpayPaymentId = paymentId;
    ride.paymentStatus = "FULL_PAID";
    ride.driverEarning = driverEarning;
    await ride.save();

    // Add to driver's pending balance for internal admin ledger
    let wallet = await Wallet.findOne({ userId: ride.driverId._id });
    if (!wallet) {
      wallet = await Wallet.create({ userId: ride.driverId._id });
    }
    wallet.pendingBalance += driverEarning;
    wallet.totalEarnings += driverEarning;
    await wallet.save();

    return { success: true, ride, driverEarning };
  } catch (error) {
    console.error("Process remaining payment error:", error);
    throw error;
  }
};

/**
 * Release driver payment (Internal Ledger management)
 */
const releaseDriverPayment = async (rideId) => {
  try {
    const ride = await Ride.findById(rideId).populate("driverId");
    if (!ride) throw new Error("Ride not found");

    const driverId = ride.driverId._id;
    const amount = ride.driverEarning;

    let wallet = await Wallet.findOne({ userId: driverId });
    if (!wallet) throw new Error("Driver wallet not found");

    if (wallet.pendingBalance >= amount) {
      wallet.pendingBalance -= amount;
      wallet.balance += amount; // Available for manual admin payout clearing
      await wallet.save();
    }

    ride.paymentStatus = "RELEASED";
    await ride.save();

    return { success: true, wallet, amount };
  } catch (error) {
    console.error("Release driver payment error:", error);
    throw error;
  }
};

module.exports = {
  calculatePaymentAmounts,
  createUpfrontPaymentOrder,
  processUpfrontPayment,
  createRemainingPaymentOrder,
  processRemainingPayment,
  releaseDriverPayment,
  COMMISSION_PERCENTAGE,
  UPFRONT_PERCENTAGE,
  PAYOUT_DELAY_HOURS,
};
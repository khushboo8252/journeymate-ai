const Ride = require("../models/Ride");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const { createOrder, verifyPayment, fetchPayment, createPayout } = require("../utils/razorpay");
const { payoutQueue } = require("../config/queue");

const PLATFORM_FEE_RATE = 0.3333;  // ~33.33% of driver fare → platform fee
const EXTRA_CHARGE_RATE = 0.30;     // 30% of platform fee → extra/convenience charge
const UPFRONT_PERCENTAGE = 0.25;    // 25% of total paid upfront
const PAYOUT_DELAY_HOURS = 3;       // 3 hours delay for driver payout

/**
 * Calculate pricing breakdown from the driver's fare.
 * Formula:
 *   platformFee    = round(driverFare × 0.3333)
 *   extraCharge    = round(platformFee × 0.30)
 *   totalAmount    = driverFare + platformFee + extraCharge
 *   bookingAmount  = round(totalAmount × 0.25)   ← paid now
 *   remainingAmount= totalAmount − bookingAmount  ← paid on completion
 *   driverEarning  = driverFare  (driver always gets their own fare, not more)
 *   platformRevenue= totalAmount − driverFare
 */
const calculateRidePrice = (driverFare) => {
  const platformFee    = Math.round(driverFare * PLATFORM_FEE_RATE);
  const extraCharge    = Math.round(platformFee * EXTRA_CHARGE_RATE);
  const totalAmount    = driverFare + platformFee + extraCharge;
  const bookingAmount  = Math.round(totalAmount * UPFRONT_PERCENTAGE);
  const remainingAmount = totalAmount - bookingAmount;
  const platformRevenue = platformFee + extraCharge;
  const driverEarning  = driverFare; // driver always gets exactly their stated fare

  return {
    driverFare,
    platformFee,
    extraCharge,
    totalAmount,
    bookingAmount,
    remainingAmount,
    driverEarning,
    platformRevenue,
  };
};

/**
 * Legacy wrapper — used by older code paths that call calculatePaymentAmounts(totalFare).
 * Here totalFare is already the passenger-facing total, so we split it directly.
 */
const calculatePaymentAmounts = (totalFare, driverEarning = null) => {
  const upfrontAmount   = Math.round(totalFare * UPFRONT_PERCENTAGE);
  const remainingAmount = totalFare - upfrontAmount;
  const commission = driverEarning !== null ? totalFare - driverEarning : 0;
  return {
    totalFare,
    upfrontAmount,
    remainingAmount,
    commission,
    driverEarning,
  };
};

/**
 * Create upfront payment order for booking
 * @param {string} rideId - Ride ID
 * @param {string} userId - User ID
 * @param {number} seatsBooked - Number of seats being booked
 */
const createUpfrontPaymentOrder = async (rideId, userId, seatsBooked = 1) => {
  try {
    const ride = await Ride.findById(rideId);
    if (!ride) {
      throw new Error("Ride not found");
    }

    // Use new pricing formula: driverFare is pricePerSeat (what driver entered)
    const pricing = calculateRidePrice(ride.driverFare || ride.pricePerSeat);
    const totalFare     = pricing.totalAmount * seatsBooked;
    const bookingAmount = pricing.bookingAmount * seatsBooked;
    const remaining     = pricing.remainingAmount * seatsBooked;

    // Persist pricing snapshot on the ride
    ride.totalFare        = totalFare;
    ride.upfrontPaid      = 0;
    ride.remainingAmount  = remaining;
    ride.driverEarning    = pricing.driverEarning * seatsBooked;
    await ride.save();

    // Create Razorpay order for upfront amount (25%)
    const receipt = `ride_${rideId}_upfront`;
    const order = await createOrder(bookingAmount, receipt, {
      userId,
      rideId,
      type: "upfront",
    });

    ride.razorpayOrderId = order.id;
    await ride.save();

    return {
      orderId: order.id,
      amount: bookingAmount,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
      pricing: {
        driverFare:      pricing.driverFare * seatsBooked,
        platformFee:     pricing.platformFee * seatsBooked,
        extraCharge:     pricing.extraCharge * seatsBooked,
        totalAmount:     totalFare,
        bookingAmount,
        remainingAmount: remaining,
      },
    };
  } catch (error) {
    console.error("Create upfront payment order error:", error);
    throw error;
  }
};

/**
 * Verify and process upfront payment
 * @param {string} rideId - Ride ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 * @param {string} userId - User ID
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

    // Update ride payment status
    ride.razorpayPaymentId = paymentId;
    ride.upfrontPaid = ride.totalFare * UPFRONT_PERCENTAGE;
    ride.paymentStatus = "PARTIAL_PAID";
    await ride.save();

    // Create transaction record
    await Transaction.create({
      userId,
      rideId,
      type: "CREDIT",
      amount: ride.upfrontPaid,
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
 * Create order for remaining 75% payment on ride completion
 * @param {string} rideId - Ride ID
 * @param {string} userId - User ID
 */
const createRemainingPaymentOrder = async (rideId, userId) => {
  try {
    const ride = await Ride.findById(rideId);
    if (!ride) {
      throw new Error("Ride not found");
    }

    if (ride.paymentStatus !== "PARTIAL_PAID") {
      throw new Error("Ride payment status is not eligible for remaining payment");
    }

    const remainingAmount = ride.remainingAmount;

    // Create Razorpay order for the remaining 75% payment
    const receipt = `ride_${rideId}_remaining`;
    const order = await createOrder(remainingAmount, receipt, {
      userId,
      rideId,
      type: "remaining",
    });

    ride.remainingRazorpayOrderId = order.id;
    await ride.save();

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
 * Process remaining payment and calculate driver earnings
 * @param {string} rideId - Ride ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 * @param {string} userId - User ID
 */
const processRemainingPayment = async (rideId, paymentId, signature, userId) => {
  try {
    const ride = await Ride.findById(rideId).populate("driverId");
    if (!ride) {
      throw new Error("Ride not found");
    }

    // Verify payment against the remaining payment order
    const orderIdToVerify = ride.remainingRazorpayOrderId || ride.razorpayOrderId;
    const isValid = verifyPayment(orderIdToVerify, paymentId, signature);
    if (!isValid) {
      throw new Error("Invalid payment signature");
    }

    // Fetch payment details
    const payment = await fetchPayment(paymentId);
    if (payment.status !== "captured") {
      throw new Error("Payment not captured");
    }

    // Determine driver earnings and commission from stored ride values
    const driverEarning = ride.driverEarning || ride.driverFare || 0;
    const commission = ride.totalFare - driverEarning;

    // Update ride payment status
    ride.razorpayPaymentId = paymentId;
    ride.paymentStatus = "FULL_PAID";
    ride.commissionPercent = ride.totalFare ? Math.round((commission / ride.totalFare) * 100) : 0;
    ride.driverEarning = driverEarning;
    await ride.save();

    // Create transaction record for remaining payment
    await Transaction.create({
      userId,
      rideId,
      type: "CREDIT",
      amount: ride.remainingAmount,
      description: "Remaining payment for completed ride",
      status: "COMPLETED",
      razorpayPaymentId: paymentId,
      razorpayOrderId: ride.razorpayOrderId,
    });

    // Add to driver's pending balance
    let wallet = await Wallet.findOne({ userId: ride.driverId._id });
    if (!wallet) {
      wallet = await Wallet.create({ userId: ride.driverId._id });
    }
    wallet.pendingBalance += driverEarning;
    wallet.totalEarnings += driverEarning;
    await wallet.save();

    // Create pending transaction for driver
    await Transaction.create({
      userId: ride.driverId._id,
      rideId,
      type: "PENDING_CREDIT",
      amount: driverEarning,
      description: "Driver earning (pending release)",
      status: "PENDING",
      metadata: {
        commission,
        driverEarning,
      },
    });

    // Schedule payout release after 3 hours
    const payoutReleaseAt = new Date(Date.now() + PAYOUT_DELAY_HOURS * 60 * 60 * 1000);
    ride.payoutReleaseAt = payoutReleaseAt;
    await ride.save();

    // Add to queue for delayed payout (only if Redis is available)
    if (payoutQueue) {
      await payoutQueue.add(
        "release-driver-payment",
        {
          rideId: ride._id,
          driverId: ride.driverId._id,
          amount: driverEarning,
        },
        {
          delay: PAYOUT_DELAY_HOURS * 60 * 60 * 1000, // 3 hours in milliseconds
          jobId: `payout_${ride._id}`,
        }
      );
    } else {
      console.log(`⚠️ Payout queue not available - driver earning will need manual release`);
    }

    return { success: true, ride, driverEarning };
  } catch (error) {
    console.error("Process remaining payment error:", error);
    throw error;
  }
};

/**
 * Release driver payment after delay period
 * @param {string} rideId - Ride ID
 */
const releaseDriverPayment = async (rideId) => {
  try {
    const ride = await Ride.findById(rideId).populate("driverId");
    if (!ride) {
      throw new Error("Ride not found");
    }

    if (ride.paymentStatus !== "FULL_PAID") {
      throw new Error("Ride payment is not complete");
    }

    if (ride.paymentStatus === "RELEASED") {
      console.log(`Payout already released for ride ${rideId}`);
      return { success: true, message: "Payout already released" };
    }

    const driverId = ride.driverId._id;
    const amount = ride.driverEarning;

    // Get driver's wallet
    let wallet = await Wallet.findOne({ userId: driverId });
    if (!wallet) {
      throw new Error("Driver wallet not found");
    }

    // Move from pending to available balance
    if (wallet.pendingBalance < amount) {
      throw new Error("Insufficient pending balance");
    }

    wallet.pendingBalance -= amount;
    wallet.balance += amount;
    await wallet.save();

    // Update ride status
    ride.paymentStatus = "RELEASED";
    await ride.save();

    // Update transaction status
    await Transaction.findOneAndUpdate(
      {
        rideId,
        type: "PENDING_CREDIT",
        status: "PENDING",
      },
      {
        status: "COMPLETED",
        type: "RELEASED_CREDIT",
        description: "Driver earning released to wallet",
      }
    );

    // Create RazorpayX payout (if driver has bank details)
    // This is optional - you can also let drivers withdraw manually
    // const payout = await createPayout({
    //   fundAccountId: driver.fundAccountId,
    //   amount,
    //   referenceId: `ride_${rideId}`,
    //   notes: { rideId, driverId: driverId.toString() },
    // });

    return { success: true, wallet, amount };
  } catch (error) {
    console.error("Release driver payment error:", error);
    throw error;
  }
};

module.exports = {
  calculateRidePrice,
  calculatePaymentAmounts,
  createUpfrontPaymentOrder,
  processUpfrontPayment,
  createRemainingPaymentOrder,
  processRemainingPayment,
  releaseDriverPayment,
  UPFRONT_PERCENTAGE,
  PLATFORM_FEE_RATE,
  EXTRA_CHARGE_RATE,
  PAYOUT_DELAY_HOURS,
};

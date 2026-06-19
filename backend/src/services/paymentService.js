const Ride = require("../models/Ride");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const { createOrder, verifyPayment, fetchPayment, createPayout } = require("../utils/razorpay");
const { payoutQueue } = require("../config/queue");

const UPFRONT_PERCENTAGE = 0.00; // 0% upfront - only GST
const COMMISSION_PERCENTAGE = 0.10; // 10% platform commission
const PAYOUT_DELAY_HOURS = 3; // 3 hours delay for driver payout

/**
 * Calculate payment amounts for a ride
 * @param {number} baseFare - Base fare set by driver (without fees)
 */
const calculatePaymentAmounts = (baseFare) => {
  // Calculate as per formula: base + 5% platform fee + 9.52% GST on (base + fee)
  const platformFee = baseFare * 0.05; // 5%
  const afterFee = baseFare + platformFee;
  const gst = afterFee * 0.0952; // 9.52% on (base + platform fee)
  const totalFare = afterFee + gst;

  // Upfront is only GST amount
  const upfrontAmount = Math.round(gst);
  // Remaining is base + platform fee
  const remainingAmount = Math.round(afterFee);
  // Driver receives full remaining amount (no commission deduction)
  const driverEarning = remainingAmount;

  return {
    baseFare,
    platformFee,
    gst,
    totalFare,
    upfrontAmount,
    remainingAmount,
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

    // Calculate total fare based on seats actually booked
    const totalFare = ride.pricePerSeat * seatsBooked;
    const { upfrontAmount } = calculatePaymentAmounts(totalFare);

    // Update ride with payment details
    ride.totalFare = totalFare;
    ride.upfrontPaid = 0;
    ride.remainingAmount = totalFare - upfrontAmount;
    ride.driverEarning = 0;
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

    // Create Razorpay order
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

    // Verify payment
    const isValid = verifyPayment(ride.razorpayOrderId, paymentId, signature);
    if (!isValid) {
      throw new Error("Invalid payment signature");
    }

    // Fetch payment details
    const payment = await fetchPayment(paymentId);
    if (payment.status !== "captured") {
      throw new Error("Payment not captured");
    }

    // Calculate driver earnings
    const { driverEarning } = calculatePaymentAmounts(ride.totalFare);

    // Update ride payment status
    ride.razorpayPaymentId = paymentId;
    ride.paymentStatus = "FULL_PAID";
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
  calculatePaymentAmounts,
  createUpfrontPaymentOrder,
  processUpfrontPayment,
  createRemainingPaymentOrder,
  processRemainingPayment,
  releaseDriverPayment,
  UPFRONT_PERCENTAGE,
  COMMISSION_PERCENTAGE,
  PAYOUT_DELAY_HOURS,
};

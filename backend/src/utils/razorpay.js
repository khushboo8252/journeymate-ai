const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay order for payment
 * @param {number} amount - Amount in rupees
 * @param {string} receipt - Receipt ID for tracking
 * @param {object} notes - Additional notes
 */
const createOrder = async (amount, receipt, notes = {}) => {
  try {
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: "INR",
      receipt,
      notes,
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    throw new Error("Failed to create payment order");
  }
};

/**
 * Verify Razorpay payment signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 */
const verifyPayment = (orderId, paymentId, signature) => {
  try {
    const crypto = require("crypto");
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    return generatedSignature === signature;
  } catch (error) {
    console.error("Payment verification error:", error);
    return false;
  }
};

/**
 * Fetch payment details from Razorpay
 * @param {string} paymentId - Razorpay payment ID
 */
const fetchPayment = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error("Fetch payment error:", error);
    throw new Error("Failed to fetch payment details");
  }
};

/**
 * Create a RazorpayX payout for driver
 * @param {object} options - Payout options
 */
const createPayout = async (options) => {
  try {
    const payout = await razorpay.payouts.create({
      account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
      fund_account_id: options.fundAccountId,
      amount: options.amount * 100, // Amount in paise
      currency: "INR",
      mode: options.mode || "UPI",
      purpose: "payout",
      queue_if_low_balance: true,
      reference_id: options.referenceId,
      notes: options.notes || {},
    });
    return payout;
  } catch (error) {
    console.error("Razorpay payout error:", error);
    throw new Error("Failed to create payout");
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  fetchPayment,
  createPayout,
  razorpay,
};

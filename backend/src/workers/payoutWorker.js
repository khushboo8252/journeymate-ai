const { Worker } = require("bullmq");
const { connection, payoutQueue } = require("../config/queue");
const { releaseDriverPayment } = require("../services/paymentService");

// Only start worker if queue is available (Redis is running)
if (payoutQueue) {
  const payoutWorker = new Worker(
    "driver-payouts",
    async (job) => {
      const { rideId, driverId, amount } = job.data;

      console.log(`Processing payout for ride ${rideId}, driver ${driverId}, amount ₹${amount}`);

      try {
        const result = await releaseDriverPayment(rideId);
        console.log(`Payout released successfully for ride ${rideId}:`, result);
        return result;
      } catch (error) {
        console.error(`Payout failed for ride ${rideId}:`, error);
        throw error;
      }
    },
    {
      connection,
      concurrency: 5,
    }
  );

  payoutWorker.on("completed", (job) => {
    console.log(`Job ${job.id} completed successfully`);
  });

  payoutWorker.on("failed", (job, err) => {
    console.error(`Job ${job.id} failed:`, err.message);
  });

  payoutWorker.on("error", (err) => {
    console.error("Worker error:", err);
  });

  module.exports = payoutWorker;
} else {
  console.log("⚠️ Payout worker not started (Redis not available)");
  module.exports = null;
}

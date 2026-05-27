const { Queue, Worker } = require("bullmq");
const Redis = require("ioredis");

let connection = null;
let payoutQueue = null;

// Only create Redis connection if explicitly enabled
const USE_REDIS = process.env.USE_REDIS === "true";

if (USE_REDIS) {
  try {
    connection = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    connection.on("error", (err) => {
      console.warn("⚠️ Redis connection error:", err.message);
    });

    // Create payout queue for delayed driver payments
    payoutQueue = new Queue("driver-payouts", {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: {
          count: 1000,
          age: 24 * 3600, // Keep completed jobs for 24 hours
        },
        removeOnFail: {
          count: 5000,
        },
      },
    });
    console.log("✅ BullMQ queue initialized with Redis");
  } catch (error) {
    console.warn("⚠️ BullMQ queue not initialized:", error.message);
  }
} else {
  console.log("⚠️ Redis disabled - delayed payouts will not work");
}

module.exports = {
  payoutQueue,
  connection,
};

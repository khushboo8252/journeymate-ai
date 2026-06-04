/**
 * Notification service — sends push notifications via Firebase Cloud Messaging (FCM).
 *
 * Gracefully degrades: if Firebase env vars are missing, notifications are logged
 * to console instead of throwing, so the rest of the app keeps working.
 *
 * Required env vars (from a Firebase service account JSON):
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY   (escape newlines as \n in .env)
 */
const User = require("../models/User");
const Booking = require("../models/Booking");

let admin = null;
let fcmEnabled = false;

try {
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    admin = require("firebase-admin");
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
    }
    fcmEnabled = true;
    console.log("🔔 Firebase Cloud Messaging initialized");
  } else {
    console.log("🔔 FCM not configured — notifications will be logged only");
  }
} catch (err) {
  console.error("🔔 FCM init failed:", err.message);
}

/**
 * Send a push notification to a single user (all their devices).
 * @param {string} userId
 * @param {{title:string, body:string, data?:object}} payload
 */
const sendToUser = async (userId, payload) => {
  try {
    const user = await User.findById(userId).select("fcmTokens").lean();
    const tokens = user?.fcmTokens || [];

    if (!fcmEnabled || tokens.length === 0) {
      console.log(`🔔 [notify:${userId}] ${payload.title} — ${payload.body}`);
      return { sent: 0 };
    }

    const message = {
      notification: { title: payload.title, body: payload.body },
      data: Object.fromEntries(
        Object.entries(payload.data || {}).map(([k, v]) => [k, String(v)])
      ),
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    // Clean up invalid tokens
    if (response.failureCount > 0) {
      const invalid = [];
      response.responses.forEach((r, idx) => {
        if (!r.success) {
          const code = r.error?.code || "";
          if (
            code.includes("registration-token-not-registered") ||
            code.includes("invalid-argument")
          ) {
            invalid.push(tokens[idx]);
          }
        }
      });
      if (invalid.length) {
        await User.findByIdAndUpdate(userId, {
          $pull: { fcmTokens: { $in: invalid } },
        });
      }
    }

    return { sent: response.successCount };
  } catch (err) {
    console.error("sendToUser error:", err.message);
    return { sent: 0, error: err.message };
  }
};

/**
 * Notify all confirmed passengers of a ride.
 * @param {string} rideId
 * @param {{title:string, body:string, data?:object}} payload
 */
const notifyRidePassengers = async (rideId, payload) => {
  try {
    const bookings = await Booking.find({
      rideId,
      status: "confirmed",
    })
      .select("passengerId")
      .lean();

    const uniquePassengers = [
      ...new Set(bookings.map((b) => b.passengerId.toString())),
    ];

    await Promise.all(uniquePassengers.map((pid) => sendToUser(pid, payload)));
    return { notified: uniquePassengers.length };
  } catch (err) {
    console.error("notifyRidePassengers error:", err.message);
    return { notified: 0, error: err.message };
  }
};

module.exports = { sendToUser, notifyRidePassengers, fcmEnabled };

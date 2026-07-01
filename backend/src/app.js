require("dotenv").config();
// CORS update for Vercel - v2
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cron = require("node-cron");
const { releaseExpiredLocks } = require("./jobs/seatLockExpiry");

const authRoutes = require("./routes/auth");
const ridesRoutes = require("./routes/rides");
const bookingsRoutes = require("./routes/bookings");
const profileRoutes = require("./routes/profile");
const adminRoutes = require("./routes/admin");
const uploadRoutes = require("./routes/upload");
const seatsRoutes = require("./routes/seats");
const paymentRoutes = require("./routes/payments");

const app = express();
const httpServer = createServer(app);

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  "https://journeymate-ai-dgfd.vercel.app",
  "https://journeymate-ai.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:8081",
].filter(Boolean);

// Socket.io setup - always allow localhost for development
const SOCKET_ORIGINS = [
  ...ALLOWED_ORIGINS,
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:8081",
];

const io = new Server(httpServer, {
  cors: {
    origin: SOCKET_ORIGINS,
    credentials: true,
  },
});

// Make io globally accessible
global.io = io;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/rides", ridesRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api", seatsRoutes);
app.use("/api/payments", paymentRoutes);

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
console.log(process.env.MONGODB_URI)
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    // Drop old unique index on bookings that prevents re-booking
    try {
      await mongoose.connection.collection("bookings").dropIndex("rideId_1_passengerId_1");
      console.log("✅ Dropped old unique booking index");
    } catch (_) {
      // Index doesn't exist — that's fine
    }

    // Socket.io connection handling
    io.on("connection", (socket) => {
      console.log(`✅ Client connected: ${socket.id}`);

      // Join user-specific room for personal notifications
      socket.on("join_user", (userId) => {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined their room`);
      });

      // Join driver-specific room for driver notifications
      socket.on("join_driver", (driverId) => {
        socket.join(`driver_${driverId}`);
        console.log(`Driver ${driverId} joined their room`);
      });

      // Join ride-specific room for real-time seat updates
      socket.on("join_ride", (rideId) => {
        socket.join(`ride_${rideId}`);
        console.log(`Client joined ride room: ${rideId}`);
      });

      // Leave ride-specific room
      socket.on("leave_ride", (rideId) => {
        socket.leave(`ride_${rideId}`);
        console.log(`Client left ride room: ${rideId}`);
      });

      // Handle seat lock requests
      socket.on("seat_lock", async (data) => {
        // This is handled via API routes, but we can add validation here if needed
        console.log(`Seat lock request:`, data);
      });

      // Handle seat release requests
      socket.on("seat_release", async (data) => {
        // This is handled via API routes, but we can add validation here if needed
        console.log(`Seat release request:`, data);
      });

      socket.on("disconnect", () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
      });
    });

    httpServer.listen(PORT, () => {
      console.log(`🚀 Ukyro API running on http://localhost:${PORT}`);
      console.log(`🔌 WebSocket server ready`);
    });

    // Schedule seat lock expiry job to run every minute
    cron.schedule('* * * * *', () => {
      releaseExpiredLocks(io);
    });
    console.log(`⏰ Seat lock expiry cron job scheduled (every minute)`);

    // Start payout worker for delayed driver payments (only if Redis is available)
    try {
      const payoutWorker = require("./workers/payoutWorker");
      if (payoutWorker) {
        console.log(`⏳ Payout worker started for delayed driver payments`);
      } else {
        console.log(`⚠️ Payout worker not started (Redis not available - delayed payouts disabled)`);
      }
    } catch (error) {
      console.error(`⚠️ Failed to start payout worker:`, error.message);
    }
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { createServer } = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth");
const ridesRoutes = require("./routes/rides");
const bookingsRoutes = require("./routes/bookings");
const profileRoutes = require("./routes/profile");
const adminRoutes = require("./routes/admin");
const uploadRoutes = require("./routes/upload");

const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:8080",
    credentials: true,
  },
});

// Make io globally accessible
global.io = io;

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:8081",
].filter(Boolean);

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

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

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

      socket.on("disconnect", () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
      });
    });

    httpServer.listen(PORT, () => {
      console.log(`🚀 RideWave API running on http://localhost:${PORT}`);
      console.log(`🔌 WebSocket server ready`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

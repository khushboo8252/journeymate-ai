const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
require("dotenv").config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@ridewave.com" });
    if (existingAdmin) {
      console.log("⚠️ Admin already exists. Updating isAdmin field and password...");
      existingAdmin.isAdmin = true;
      existingAdmin.password = "admin123"; // Will be hashed by pre-save hook
      await existingAdmin.save();
      console.log("✅ Admin updated successfully");
      process.exit(0);
    }

    // Create new admin (password will be hashed by User model pre-save hook)
    const admin = await User.create({
      fullName: "Admin User",
      email: "admin@ridewave.com",
      password: "admin123",
      isAdmin: true,
      role: "driver", // Admin can also be a driver if needed
      isProfileComplete: true,
    });

    console.log("✅ Admin created successfully!");
    console.log("Email: admin@ridewave.com");
    console.log("Password: admin123");
    console.log("⚠️ Please change the password after first login!");
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating admin:", err.message);
    process.exit(1);
  }
}

createAdmin();

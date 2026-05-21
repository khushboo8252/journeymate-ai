const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

async function deleteAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Delete admin user
    const result = await User.deleteOne({ email: "admin@ridewave.com" });
    
    if (result.deletedCount > 0) {
      console.log("✅ Admin user deleted successfully");
    } else {
      console.log("⚠️ Admin user not found");
    }
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Error deleting admin:", err.message);
    process.exit(1);
  }
}

deleteAdmin();

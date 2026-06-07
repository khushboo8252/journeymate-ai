const express = require("express");
const multer = require("multer");
const { protect } = require("../middleware/auth");
const { uploadToCloudinary, deleteFromCloudinary } = require("../utils/cloudinary");
const User = require("../models/User");

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// POST /api/upload/avatar — upload user avatar
router.post("/avatar", protect, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete old avatar from Cloudinary if exists
    if (user.avatarPublicId) {
      await deleteFromCloudinary(user.avatarPublicId);
    }

    // Convert buffer to base64 for Cloudinary upload
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    // Upload new avatar to Cloudinary
    const result = await uploadToCloudinary(base64, "ukyro/avatars");

    // Update user with new avatar
    user.avatarUrl = result.url;
    user.avatarPublicId = result.public_id;
    await user.save();

    res.json({
      avatarUrl: user.avatarUrl,
      avatarPublicId: user.avatarPublicId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/upload/document — upload driver verification document
router.post("/document", protect, upload.single("document"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { type, side } = req.body; // type: drivingLicense, aadharCard, panCard, rc, vehicleImage; side: front, back (optional)

    if (!type) {
      return res.status(400).json({ error: "Document type is required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Initialize nested objects if they don't exist
    if (!user[type]) {
      user[type] = {};
    }

    // Delete old document from Cloudinary if exists
    const sideKey = side || "front";
    const publicIdKey = sideKey + "PublicId";
    
    if (user[type][publicIdKey]) {
      await deleteFromCloudinary(user[type][publicIdKey]);
    }

    // Convert buffer to base64 for Cloudinary upload
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    // Upload document to Cloudinary
    const result = await uploadToCloudinary(base64, `ukyro/documents/${type}`);

    // Update user with new document
    const urlKey = sideKey + "Url";
    user[type][urlKey] = result.url;
    user[type][publicIdKey] = result.public_id;

    await user.save();

    res.json({
      url: result.url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error("Document upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (file, folder = "ridewave") => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder,
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      max_file_size: 5000000, // 5MB
    });
    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error(`Failed to upload image to Cloudinary: ${error.message || error}`);
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Failed to delete image from Cloudinary:", error);
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
};

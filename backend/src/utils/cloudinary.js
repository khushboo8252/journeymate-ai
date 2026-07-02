const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (file, folder = "ukyro") => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder,
      // 🚨 [FIXED]: 'pdf' add kar diya hai for DL, RC, Insurance documents
      allowed_formats: ["jpg", "jpeg", "png", "webp", "pdf"],
      
      // 🚨 [FIXED]: "auto" lagana zaroori hai warna Cloudinary PDF ko reject kar dega
      resource_type: "auto", 
      
      // Note: Cloudinary backend me max_file_size ignore karta hai. 
      // Par server.js me app.use(express.json({ limit: "10mb" })) ise securely handle kar lega.
    });
    
    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error(`Failed to upload file to Cloudinary: ${error.message || error}`);
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    // 🚨 PDF/Raw files delete karne ke liye resource_type auto chahiye hota hai
    await cloudinary.uploader.destroy(publicId, { invalidate: true, resource_type: "image" });
    // Cloudinary kabhi-kabhi non-images ko alag treat karta hai, agar fail ho toh fallback try karo
    await cloudinary.uploader.destroy(publicId, { invalidate: true, resource_type: "raw" });
  } catch (error) {
    console.error("Failed to delete file from Cloudinary:", error);
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
};
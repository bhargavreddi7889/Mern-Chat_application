import { v2 as cloudinary } from "cloudinary";
import { config } from "dotenv";

config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test Cloudinary configuration
(async () => {
  try {
    const result = await cloudinary.api.ping();
    console.log("Cloudinary configuration is valid:", result.status === "ok");
  } catch (error) {
    console.error("Cloudinary configuration error:", error.message);
  }
})();

export const uploadToCloudinary = async (file) => {
  try {
    if (!file || !file.buffer) {
      console.error("No file or buffer provided for upload");
      throw new Error("No file provided");
    }

    console.log("Preparing to upload to Cloudinary:", {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: `${(file.size / 1024).toFixed(2)} KB`
    });

    // Convert buffer to base64
    const base64String = file.buffer.toString('base64');
    const dataURI = `data:${file.mimetype};base64,${base64String}`;
    
    // Upload directly using the upload API with proper error handling
    try {
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: "chat_app",
        resource_type: "auto",
        allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
        transformation: [
          { quality: "auto:good" },
          { fetch_format: "auto" },
          { width: 800, crop: "limit" }
        ]
      });
      
      console.log("Cloudinary upload successful:", result.secure_url);
      return result;
    } catch (uploadError) {
      console.error("Cloudinary upload error details:", uploadError);
      throw new Error(`Cloudinary upload failed: ${uploadError.message}`);
    }
  } catch (error) {
    console.error("Error in uploadToCloudinary:", error);
    throw error;
  }
};

export { cloudinary };

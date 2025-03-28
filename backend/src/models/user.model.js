import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    username: { 
      type: String, 
      required: true, 
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    gender: {
      type: String,
      required: true,
      enum: ["male", "female"],
    },
    profilePic: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Create compound index for user search
userSchema.index({ fullName: 1, username: 1, email: 1 });

// ✅ Fix: Prevent model overwrite
export const User = mongoose.models.User || mongoose.model("User", userSchema);

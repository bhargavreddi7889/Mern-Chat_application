import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { generateToken } from "../lib/utils.js";
import { uploadToCloudinary } from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  try {
    const { fullName, username, email, password, confirmPassword, gender } = req.body;

    // Validate required fields
    if (!fullName || !username || !email || !password || !confirmPassword || !gender) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords don't match" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Check if email or username already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ error: "Email already exists" });
      }
      return res.status(400).json({ error: "Username already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`;
    const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${username}`;

    const newUser = new User({
      fullName,
      username,
      email,
      password: hashedPassword,
      gender,
      profilePic: gender === "male" ? boyProfilePic : girlProfilePic,
    });

    await newUser.save();
    generateToken(newUser._id, res);

    res.status(201).json({
      _id: newUser._id,
      fullName: newUser.fullName,
      username: newUser.username,
      profilePic: newUser.profilePic,
      gender: newUser.gender,
    });
  } catch (error) {
    console.error("Error in signup controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      profilePic: user.profilePic,
      gender: user.gender,
    });
  } catch (error) {
    console.error("Error in login controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/",
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logout controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName } = req.body;
    const profilePic = req.file;
    const userId = req.user._id;

    console.log('Update profile request received:', {
      userId,
      fullName: fullName || 'Not provided',
      hasProfilePic: !!profilePic,
      fileDetails: profilePic ? {
        originalname: profilePic.originalname,
        mimetype: profilePic.mimetype,
        size: `${(profilePic.size / 1024).toFixed(2)} KB`,
        hasBuffer: !!profilePic.buffer
      } : 'No file'
    });

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update fullName if provided
    if (fullName) {
      user.fullName = fullName;
      console.log(`Updating fullName to: ${fullName}`);
    }

    // Handle profile picture upload
    if (profilePic) {
      try {
        console.log('Starting profile picture upload to Cloudinary');
        
        // Upload the new profile picture
        const uploadedImage = await uploadToCloudinary(profilePic);
        
        // If successful, update the user's profile picture
        if (uploadedImage && uploadedImage.secure_url) {
          user.profilePic = uploadedImage.secure_url;
          console.log('Profile picture updated successfully:', uploadedImage.secure_url);
        } else {
          console.error('Cloudinary upload failed - no secure_url returned');
          return res.status(400).json({ error: "Failed to upload profile picture - no URL returned" });
        }
      } catch (uploadError) {
        console.error("Error uploading to Cloudinary:", uploadError);
        return res.status(400).json({ error: `Failed to upload profile picture: ${uploadError.message}` });
      }
    }

    // Save the updated user
    await user.save();
    console.log('User profile updated successfully');

    // Return the updated user data
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      profilePic: user.profilePic,
      gender: user.gender,
      email: user.email,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error("Error in updateProfile controller:", error);
    res.status(500).json({ error: `Internal Server Error: ${error.message}` });
  }
};

export const checkAuth = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error in checkAuth controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("-password")
      .sort({ fullName: 1 });

    res.status(200).json(users);
  } catch (error) {
    console.error("Error in getUsers controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

import { User } from "../models/user.model.js";

export const getUsers = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    console.log("Fetching users for:", loggedInUserId);

    // Get all users except the logged in user, sorted by name
    const users = await User.find({ 
      _id: { $ne: loggedInUserId },
      // Only return active users
      isActive: { $ne: false }
    })
      .select("-password -__v")
      .sort({ fullName: 1 });

    console.log(`Found ${users.length} users`);
    res.status(200).json(users);
  } catch (error) {
    console.error("Error in getUsers controller:", error);
    res.status(500).json({ error: "Failed to fetch users. Please try again." });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    console.log("Fetching profile for user:", userId);

    const user = await User.findById(userId)
      .select("-password -__v")
      .lean();

    if (!user) {
      console.log("User not found:", userId);
      return res.status(404).json({ error: "User not found" });
    }

    console.log("User profile fetched successfully");
    res.status(200).json(user);
  } catch (error) {
    console.error("Error in getUserProfile controller:", error);
    res.status(500).json({ error: "Failed to fetch user profile. Please try again." });
  }
};

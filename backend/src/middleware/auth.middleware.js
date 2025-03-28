import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      console.log("No token found in cookies");
      return res.status(401).json({ error: "Please login to continue" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (!decoded?.userId) {
        console.log("Invalid token format - no userId found");
        res.cookie("jwt", "", { maxAge: 0 });
        return res.status(401).json({ error: "Invalid token format" });
      }

      const user = await User.findById(decoded.userId).select("-password -__v");

      if (!user) {
        console.log("User not found for token:", decoded.userId);
        res.cookie("jwt", "", { maxAge: 0 });
        return res.status(401).json({ error: "User not found" });
      }

      req.user = user;
      next();
    } catch (err) {
      console.error("Token verification error:", err);
      res.cookie("jwt", "", { 
        maxAge: 0,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
      });
      return res.status(401).json({ error: "Invalid or expired token. Please login again." });
    }
  } catch (error) {
    console.error("Error in protectRoute middleware:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

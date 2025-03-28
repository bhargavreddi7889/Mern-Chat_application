import express from "express";
import { getUsers, getUserProfile } from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get all users except the current user
router.get("/", protectRoute, getUsers);

// Get user profile by ID or current user if no ID provided
router.get("/profile/:userId?", protectRoute, getUserProfile);

export default router;

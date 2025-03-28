import express from "express";
import mongoose from "mongoose";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  addMembers,
  createGroup,
  deleteGroup,
  getGroupMessages,
  promoteToAdmin,
  removeMember,
  sendGroupMessage
} from "../controllers/group.controller.js";
import { Group } from "../models/group.model.js";

const router = express.Router();

// All routes are protected
router.use(protectRoute);

// Group management routes
router.post("/create", createGroup);
router.post("/:groupId/members", addMembers);
router.delete("/:groupId/members/:userId", removeMember);
router.post("/:groupId/promote", promoteToAdmin);
router.delete("/:groupId", deleteGroup);

// Group messaging routes
router.get("/:groupId/messages", getGroupMessages);
router.post("/:groupId/messages", sendGroupMessage);

// Get all groups a user is part of
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const groups = await Group.find({
      "members.user": userObjectId
    }).populate('members.user', 'fullName username email profilePic');

    res.json(groups);
  } catch (error) {
    console.error('Error in getUserGroups:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get group details
router.get("/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId)
      .populate('members.user', 'fullName username email profilePic');
    
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    
    res.json(group);
  } catch (error) {
    console.error('Error in getGroupDetails:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;

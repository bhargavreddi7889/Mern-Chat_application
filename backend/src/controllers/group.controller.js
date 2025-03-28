import { Group } from "../models/group.model.js";
import { Message } from "../models/message.model.js";
import { io } from "../lib/socket.js";
import { cloudinary, uploadToCloudinary } from "../lib/cloudinary.js";

export const createGroup = async (req, res) => {
  try {
    const { name, members } = req.body;
    const userId = req.user._id;

    if (!name || !members || !Array.isArray(members)) {
      return res.status(400).json({ message: "Invalid group data" });
    }

    // Add the creator as an admin
    const groupMembers = [
      { user: userId, role: "admin" },
      ...members.map(id => ({ user: id, role: "member" }))
    ];

    const group = await Group.create({
      name,
      members: groupMembers
    });

    const populatedGroup = await Group.findById(group._id)
      .populate('members.user', 'fullName username email profilePic');

    // Notify all members about the new group
    groupMembers.forEach(member => {
      io.to(member.user.toString()).emit("new-group", populatedGroup);
    });

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.error('Error in createGroup:', error);
    res.status(500).json({ message: error.message });
  }
};

export const addMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userIds, adminId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if the requester is an admin
    const isAdmin = group.members.some(m => 
      m.user.toString() === adminId && m.role === "admin"
    );
    if (!isAdmin) {
      return res.status(403).json({ message: "Only admins can add members" });
    }

    // Add new members
    const newMembers = userIds.map(id => ({ user: id, role: "member" }));
    group.members.push(...newMembers);
    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate('members.user', 'fullName username email profilePic');

    // Notify all members about the update
    group.members.forEach(member => {
      io.to(member.user.toString()).emit("group-updated", updatedGroup);
    });

    res.json(updatedGroup);
  } catch (error) {
    console.error('Error in addMembers:', error);
    res.status(500).json({ message: error.message });
  }
};

export const removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const { adminId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if the requester is an admin
    const isAdmin = group.members.some(m => 
      m.user.toString() === adminId && m.role === "admin"
    );
    if (!isAdmin) {
      return res.status(403).json({ message: "Only admins can remove members" });
    }

    // Remove the member
    group.members = group.members.filter(m => m.user.toString() !== userId);
    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate('members.user', 'fullName username email profilePic');

    // Notify all remaining members about the update
    group.members.forEach(member => {
      io.to(member.user.toString()).emit("group-updated", updatedGroup);
    });

    // Notify the removed member
    io.to(userId).emit("removed-from-group", groupId);

    res.json(updatedGroup);
  } catch (error) {
    console.error('Error in removeMember:', error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if the requester is an admin
    const isAdmin = group.members.some(m => 
      m.user.toString() === userId && m.role === "admin"
    );
    if (!isAdmin) {
      return res.status(403).json({ message: "Only admins can delete the group" });
    }

    // Delete all messages in the group
    const messages = await Message.find({ groupId });
    for (const message of messages) {
      if (message.image) {
        const publicId = message.image.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`chat-app/${publicId}`);
      }
      await message.deleteOne();
    }

    // Delete the group
    await group.deleteOne();

    // Notify all members about group deletion
    group.members.forEach(member => {
      io.to(member.user.toString()).emit("group-deleted", groupId);
    });

    res.json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error('Error in deleteGroup:', error);
    res.status(500).json({ message: error.message });
  }
};

export const promoteToAdmin = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId, adminId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if the requester is an admin
    const isAdmin = group.members.some(m => 
      m.user.toString() === adminId && m.role === "admin"
    );
    if (!isAdmin) {
      return res.status(403).json({ message: "Only admins can promote members" });
    }

    // Promote the member to admin
    const memberIndex = group.members.findIndex(m => m.user.toString() === userId);
    if (memberIndex === -1) {
      return res.status(404).json({ message: "Member not found" });
    }

    group.members[memberIndex].role = "admin";
    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate('members.user', 'fullName username email profilePic');

    // Notify all members about the update
    group.members.forEach(member => {
      io.to(member.user.toString()).emit("group-updated", updatedGroup);
    });

    res.json(updatedGroup);
  } catch (error) {
    console.error('Error in promoteToAdmin:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is a member of the group
    const isMember = group.members.some(m => m.user.toString() === userId.toString());
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    const messages = await Message.find({ groupId })
      .populate('senderId', 'fullName username profilePic')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Error in getGroupMessages:', error);
    res.status(500).json({ message: error.message });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    console.log('Group message request received:', {
      userId,
      groupId,
      text: text || 'No text'
    });

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is a member of the group
    const isMember = group.members.some(m => m.user.toString() === userId.toString());
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    // Check if there's text
    if (!text) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const message = await Message.create({
      senderId: userId,
      groupId,
      text: text
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'fullName username profilePic');

    // Notify all group members about the new message
    group.members.forEach(member => {
      io.to(member.user.toString()).emit("new-group-message", {
        groupId,
        message: populatedMessage
      });
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error in sendGroupMessage:', error);
    res.status(500).json({ message: error.message });
  }
};

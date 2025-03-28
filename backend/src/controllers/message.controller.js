import { Message } from "../models/message.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { Group } from "../models/group.model.js";

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverId } = req.params;
    const { text, isGroup } = req.body;
    
    console.log('Message request received:', {
      senderId,
      receiverId,
      text: text || 'No text provided',
      isGroup: isGroup || 'false',
      contentType: req.headers['content-type'] || 'No content-type header',
      body: req.body
    });
    
    // Basic validation
    if (!receiverId) {
      return res.status(400).json({ error: "Receiver ID is required" });
    }

    // Check if there's text
    if (!text) {
      return res.status(400).json({ error: "Message text is required" });
    }

    let messageData = {
      senderId,
      text: text.trim()
    };

    // Handle group messages
    if (isGroup === 'true') {
      const group = await Group.findById(receiverId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      // Check if user is a member of the group
      const isMember = group.members.some(m => m.user.toString() === senderId.toString());
      if (!isMember) {
        return res.status(403).json({ error: "You are not a member of this group" });
      }

      messageData.groupId = receiverId;
    } else {
      messageData.receiverId = receiverId;
    }

    // Create message
    const message = await Message.create(messageData);
    console.log('Message created:', message._id);

    // Populate sender details
    const populatedMessage = await Message.findById(message._id)
      .populate("senderId", "fullName username profilePic email");

    if (!populatedMessage) {
      return res.status(404).json({ error: "Message not found after creation" });
    }

    // Handle notifications
    if (isGroup === 'true') {
      const group = await Group.findById(receiverId);
      // Notify all group members
      group.members.forEach(member => {
        if (member.user.toString() !== senderId.toString()) {
          const memberSocketId = getReceiverSocketId(member.user.toString());
          if (memberSocketId) {
            io.to(memberSocketId).emit("newGroupMessage", {
              groupId: receiverId,
              message: populatedMessage
            });
          }
        }
      });
    } else {
      // Notify individual receiver
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", populatedMessage);
      }
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error in sendMessage controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const { isGroup } = req.query;
    const userId = req.user._id;

    if (!otherUserId) {
      return res.status(400).json({ error: "Other user/group ID is required" });
    }

    let messages;
    if (isGroup === 'true') {
      // Check group membership
      const group = await Group.findById(otherUserId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      const isMember = group.members.some(m => m.user.toString() === userId.toString());
      if (!isMember) {
        return res.status(403).json({ error: "You are not a member of this group" });
      }

      messages = await Message.find({ groupId: otherUserId })
        .populate("senderId", "fullName username profilePic email")
        .sort({ createdAt: 1 });
    } else {
      messages = await Message.find({
        $or: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      })
        .populate("senderId", "fullName username profilePic email")
        .sort({ createdAt: 1 });
    }

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getMessages controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    if (!messageId) {
      return res.status(400).json({ error: "Message ID is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if the user is the sender of the message
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can only delete your own messages" });
    }

    await message.deleteOne();

    // Notify about message deletion
    if (message.groupId) {
      // Notify group members
      const group = await Group.findById(message.groupId);
      if (group) {
        group.members.forEach(member => {
          const memberSocketId = getReceiverSocketId(member.user.toString());
          if (memberSocketId) {
            io.to(memberSocketId).emit("messageDeleted", {
              messageId,
              groupId: message.groupId
            });
          }
        });
      }
    } else {
      // Notify individual receiver
      const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageDeleted", {
          messageId,
          userId: message.receiverId
        });
      }
    }

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error in deleteMessage controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

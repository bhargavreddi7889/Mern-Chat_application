import { Server } from "socket.io";
import http from "http";
import express from "express";
import { User } from "../models/user.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  pingTimeout: 60000,
  transports: ["websocket", "polling"]
});

// used to store online users and their socket IDs
const userSocketMap = new Map();

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("setup", async (userId) => {
    try {
      // Update user's active status
      await User.findByIdAndUpdate(userId, { isActive: true });

      userSocketMap.set(userId, socket.id);
      socket.join(userId);
      console.log("User setup completed:", userId);
      
      // Get all online users and emit their IDs
      const onlineUsers = Array.from(userSocketMap.keys());
      console.log("Online users:", onlineUsers);
      io.emit("getOnlineUsers", onlineUsers);
    } catch (error) {
      console.error("Error in socket setup:", error);
    }
  });

  socket.on("joinGroup", (groupId) => {
    if (!groupId) return;
    socket.join(groupId);
    console.log(`User joined group: ${groupId}`);
  });

  socket.on("leaveGroup", (groupId) => {
    if (!groupId) return;
    socket.leave(groupId);
    console.log(`User left group: ${groupId}`);
  });

  socket.on("typing", (room) => {
    if (!room) return;
    socket.to(room).emit("typing");
  });

  socket.on("stopTyping", (room) => {
    if (!room) return;
    socket.to(room).emit("stopTyping");
  });

  // Handle group message events
  socket.on("sendGroupMessage", (data) => {
    if (!data.groupId) return;
    socket.to(data.groupId).emit("new-group-message", data);
  });

  socket.on("disconnect", async () => {
    console.log("Socket disconnected:", socket.id);
    
    // Find and update the disconnected user
    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        try {
          // Update user's active status
          await User.findByIdAndUpdate(userId, { isActive: false });
          
          userSocketMap.delete(userId);
          console.log("User disconnected:", userId);
          
          // Get remaining online users and emit their IDs
          const onlineUsers = Array.from(userSocketMap.keys());
          console.log("Remaining online users:", onlineUsers);
          io.emit("getOnlineUsers", onlineUsers);
          break;
        } catch (error) {
          console.error("Error handling disconnect:", error);
        }
      }
    }
  });
});

export const getReceiverSocketId = (receiverId) => {
  return userSocketMap.get(receiverId);
};

export { io, app, server };

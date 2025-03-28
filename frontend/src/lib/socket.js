import { io } from "socket.io-client";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";

const SOCKET_URL = import.meta.env.MODE === "development" 
  ? "http://localhost:5001" 
  : undefined;

// Create a single socket instance
let socket = null;

// Track received group IDs to prevent duplicate notifications
const receivedGroups = new Set();

// Track received message IDs to prevent duplicate messages
const receivedMessages = new Set();

// Initialize socket connection
export const initializeSocket = () => {
  if (socket) return socket;
  
  socket = io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: false,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 20000
  });
  
  return socket;
};

// Get the socket instance
export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

export const connectSocket = (userId) => {
  if (!userId) return;
  
  // Get or initialize socket
  const socketInstance = getSocket();
  
  // If already connected with the same user, don't reconnect
  if (socketInstance.connected && socketInstance.auth?.userId === userId) {
    console.log("Socket already connected for user:", userId);
    return;
  }

  // Clear the tracking sets when reconnecting
  receivedGroups.clear();
  receivedMessages.clear();

  // Set auth and connect
  socketInstance.auth = { userId };
  
  // Only connect if not already connected
  if (!socketInstance.connected) {
    socketInstance.connect();
  }

  // Set up event handlers if they haven't been set up yet
  if (!socketInstance._eventsCount || socketInstance._eventsCount < 5) {
    setupEventHandlers(socketInstance, userId);
  }
};

const setupEventHandlers = (socketInstance, userId) => {
  // Remove any existing listeners to prevent duplicates
  socketInstance.removeAllListeners();
  
  socketInstance.on("connect", () => {
    console.log("Socket connected:", socketInstance.id);
    socketInstance.emit("setup", userId);
  });

  socketInstance.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  socketInstance.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
    
    // Attempt to reconnect if disconnected by server
    if (reason === "io server disconnect") {
      setTimeout(() => {
        if (socketInstance.auth?.userId) {
          socketInstance.connect();
        }
      }, 1000);
    }
  });

  // Handle direct messages
  socketInstance.on("newMessage", (message) => {
    const chatStore = useChatStore.getState();
    chatStore.addMessage(message, false);
  });

  socketInstance.on("messageDeleted", ({ messageId, userId }) => {
    const chatStore = useChatStore.getState();
    chatStore.handleMessageDeleted(messageId, userId, false);
  });

  // Handle group messages
  socketInstance.on("new-group-message", ({ groupId, message }) => {
    if (!groupId || !message || !message._id) return;
    
    // Check if we've already received this message to prevent duplicates
    if (receivedMessages.has(message._id)) {
      console.log("Duplicate message notification ignored:", message._id);
      return;
    }
    
    // Add to our tracking set
    receivedMessages.add(message._id);
    
    console.log("Received new group message:", { groupId, message });
    const groupStore = useGroupStore.getState();
    groupStore.addGroupMessage(groupId, message);
    
    // Clean up the set after a delay to prevent memory leaks
    setTimeout(() => {
      receivedMessages.delete(message._id);
    }, 10000); // Clear after 10 seconds
  });

  socketInstance.on("messageDeleted", ({ messageId, groupId }) => {
    if (groupId) {
      const groupStore = useGroupStore.getState();
      groupStore.handleMessageDeleted(messageId, groupId);
    }
  });

  // Join a group chat room
  socketInstance.on("joinGroup", (groupId) => {
    if (!groupId) return;
    socketInstance.emit("joinGroup", groupId);
    console.log("Joined group:", groupId);
  });

  // Handle group events
  socketInstance.on("new-group", (group) => {
    if (!group || !group._id) return;
    
    // Check if we've already received this group to prevent duplicates
    if (receivedGroups.has(group._id)) {
      console.log("Duplicate group notification ignored:", group._id);
      return;
    }
    
    // Add to our tracking set
    receivedGroups.add(group._id);
    
    const groupStore = useGroupStore.getState();
    groupStore.handleNewGroup(group);
    toast.success(`Added to new group: ${group.name}`);
    
    // Clean up the set after a delay to prevent memory leaks
    setTimeout(() => {
      receivedGroups.delete(group._id);
    }, 10000); // Clear after 10 seconds
  });

  socketInstance.on("group-updated", (group) => {
    const groupStore = useGroupStore.getState();
    groupStore.handleGroupUpdated(group);
  });

  socketInstance.on("removed-from-group", (groupId) => {
    const groupStore = useGroupStore.getState();
    groupStore.handleRemovedFromGroup(groupId);
    toast.info("You have been removed from the group");
  });

  socketInstance.on("group-deleted", (groupId) => {
    const groupStore = useGroupStore.getState();
    groupStore.handleRemovedFromGroup(groupId);
    toast.info("Group has been deleted");
  });
  
  socketInstance.on("getOnlineUsers", (userIds) => {
    const authStore = useAuthStore.getState();
    if (authStore.setOnlineUsers) {
      authStore.setOnlineUsers(userIds);
    }
  });
};

// Helper function to join a group chat
export const joinGroupChat = (groupId) => {
  const socketInstance = getSocket();
  if (!socketInstance.connected || !groupId) return;
  socketInstance.emit("joinGroup", groupId);
};

// Helper function to leave a group chat
export const leaveGroupChat = (groupId) => {
  const socketInstance = getSocket();
  if (!socketInstance.connected || !groupId) return;
  socketInstance.emit("leaveGroup", groupId);
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};

// Export the socket for direct access if needed
export { socket };

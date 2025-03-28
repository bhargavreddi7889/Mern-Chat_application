import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { connectSocket, disconnectSocket } from "../lib/socket.js";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      connectSocket(res.data._id);
    } catch (error) {
      set({ authUser: null });
      // Only show error if it's not an authentication error
      if (error?.response?.status !== 401) {
        toast.error(error?.error || "Failed to check authentication status");
      }
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      connectSocket(res.data._id);
    } catch (error) {
      toast.error(error?.error || "Failed to create account");
      throw error;
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");
      connectSocket(res.data._id);
    } catch (error) {
      toast.error(error?.error || "Failed to login");
      throw error;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null, onlineUsers: [] });
      disconnectSocket();
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error(error?.error || "Failed to logout");
    }
  },

  updateProfile: async (formData) => {
    if (!get().authUser) return;
    
    try {
      set({ isUpdatingProfile: true });
      
      console.log("Sending profile update request with FormData");
      
      // Make sure we're not manually setting Content-Type for FormData
      const response = await axiosInstance.put("/auth/update-profile", formData);
      
      console.log("Profile update response:", response.data);
      
      // Update the auth user with the new data
      set({ authUser: response.data });
      
      return response.data;
    } catch (error) {
      console.error("Error updating profile:", error);
      
      // Extract error message from response if available
      const errorMessage = error.response?.data?.error || "Failed to update profile";
      
      // Throw a structured error object that can be caught by the component
      throw { error: errorMessage, details: error.response?.data };
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  setOnlineUsers: (userIds) => {
    set({ onlineUsers: userIds });
  }
}));

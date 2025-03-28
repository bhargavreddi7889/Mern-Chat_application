import { useEffect, useRef } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { Loader2, MessageSquare } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { connectSocket, disconnectSocket } from "./lib/socket";
import { useListenMessages } from "./hooks/useListenMessages";

import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { theme } = useThemeStore();
  const reconnectTimerRef = useRef(null);

  // Listen for real-time messages
  useListenMessages();

  // Check authentication status on app load
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Handle socket connection
  useEffect(() => {
    if (authUser?._id) {
      // Connect socket when user is authenticated
      connectSocket(authUser._id);
      
      // Set up a periodic reconnection check
      if (!reconnectTimerRef.current) {
        reconnectTimerRef.current = setInterval(() => {
          console.log("Reconnection check...");
          connectSocket(authUser._id);
        }, 30000); // Check every 30 seconds
      }
    } else {
      // Disconnect socket when user is not authenticated
      disconnectSocket();
      
      // Clear reconnection timer
      if (reconnectTimerRef.current) {
        clearInterval(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    }

    // Cleanup on component unmount or when authUser changes
    return () => {
      if (reconnectTimerRef.current) {
        clearInterval(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [authUser?._id]);

  // Show loading spinner while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-base-300 to-base-100">
        <div className="flex flex-col items-center gap-6">
          <div className="size-16 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse shadow-lg">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Chat Application
          </h1>
          <Loader2 className="w-10 h-10 animate-spin text-primary mt-4" />
        </div>
      </div>
    );
  }

  return (
    <div data-theme={theme}>
      <Navbar />

      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/settings" element={authUser ? <SettingsPage /> : <Navigate to="/login" />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
      </Routes>

      <Toaster position="top-center" />
    </div>
  );
};

export default App;

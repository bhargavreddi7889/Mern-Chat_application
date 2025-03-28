import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, MessageSquare, Settings, User } from "lucide-react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();

  // Format the app name dynamically based on user login status
  const appTitle = authUser 
    ? `${authUser.fullName.split(' ')[0]}'s Chat` 
    : 'Welcome to Chat';

  return (
    <header
      className="bg-base-100 shadow-sm border-b border-base-300 fixed w-full top-0 z-40 
      backdrop-blur-xl bg-base-100/95 h-16"
    >
      <div className="container mx-auto px-4 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo and App Name */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-all">
              <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {appTitle}
              </h1>
            </Link>
          </div>

          {/* Navigation Links */}
          {authUser && (
            <div className="flex items-center gap-3">
              <Link
                to="/settings"
                className="btn btn-sm btn-ghost gap-2 hover:bg-base-200"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Settings</span>
              </Link>

              <Link 
                to="/profile" 
                className="btn btn-sm btn-ghost gap-2 hover:bg-base-200"
                aria-label="Profile"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Profile</span>
              </Link>

              <button 
                onClick={logout} 
                className="btn btn-sm btn-ghost gap-2 hover:bg-base-200"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
export default Navbar;

import { MessageSquare } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

const NoChatSelected = () => {
  const { authUser } = useAuthStore();
  
  // Get the user's first name or a default welcome message
  const userName = authUser?.fullName?.split(' ')[0] || 'Your';
  const welcomeText = `${userName}'s Chat`;
  
  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-16 bg-base-100/50">
      <div className="max-w-md text-center space-y-6">
        {/* Icon Display */}
        <div className="flex justify-center gap-4 mb-4">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center
             justify-center animate-pulse shadow-lg"
            >
              <MessageSquare className="w-10 h-10 text-primary" />
            </div>
          </div>
        </div>

        {/* Welcome Text */}
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          {welcomeText}
        </h2>
        <p className="text-base-content/70 text-lg">
          Select a conversation to start messaging
        </p>
      </div>
    </div>
  );
};

export default NoChatSelected;

import { useAuthStore } from "../store/useAuthStore";
import { Info, Shield } from "lucide-react";

const ChatHeader = ({ chat, isGroup, onGroupInfoClick }) => {
  const { onlineUsers } = useAuthStore();

  if (!chat) return null;

  const isOnline = isGroup 
    ? false 
    : onlineUsers?.includes(chat._id);

  return (
    <div className="p-4 border-b flex items-center gap-4 bg-base-200/50">
      <div className="flex items-center gap-3 flex-1">
        <div className="avatar">
          <div className="w-12 rounded-full relative">
            <img 
              src={chat.profilePic || "/avatar.png"} 
              alt={isGroup ? chat.name : chat.fullName} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/avatar.png";
              }}
            />
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-base-100" />
            )}
          </div>
        </div>
        <div>
          <h3 className="font-semibold">{isGroup ? chat.name : chat.fullName}</h3>
          {isGroup ? (
            <p className="text-sm opacity-70">
              {chat.members?.length || 0} members
            </p>
          ) : (
            <p className="text-sm opacity-70">
              {isOnline ? "Online" : "Offline"}
              <span className="mx-1">•</span>
              @{chat.username || 'user'}
            </p>
          )}
        </div>
      </div>

      {isGroup && (
        <button 
          onClick={onGroupInfoClick}
          className="btn btn-ghost btn-circle"
          title="Group Info"
        >
          <Info className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default ChatHeader;

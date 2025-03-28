import { useAuthStore } from "../store/useAuthStore";
import { formatTime } from "../utils/formatTime";
import { Trash2, Check, Image, Shield } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

const Message = ({ message, isGroup = false, onDelete, isAdmin = false }) => {
  const { authUser } = useAuthStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwnMessage = message.senderId._id === authUser._id;
  const canDelete = isOwnMessage || (isGroup && isAdmin);
  const senderIsAdmin = isGroup && message.senderId.role === 'admin';

  const handleDelete = async () => {
    if (!canDelete || isDeleting) return;

    try {
      setIsDeleting(true);
      await onDelete(message._id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
    >
      {/* Avatar for group messages from others */}
      {isGroup && !isOwnMessage && (
        <div className="self-end mb-1 mr-2">
          <div className="relative">
            <img
              src={message.senderId.profilePic || "/avatar.png"}
              alt={message.senderId.fullName}
              className="w-8 h-8 rounded-full object-cover"
            />
            {senderIsAdmin && (
              <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5">
                <Shield className="w-3 h-3 text-primary-content" />
              </div>
            )}
          </div>
        </div>
      )}

      <div
        className={`relative group max-w-[75%] ${
          isOwnMessage
            ? 'bg-primary text-primary-content'
            : 'bg-base-300 text-base-content'
        } rounded-lg p-3 space-y-1 shadow-sm`}
      >
        {/* Show sender name in group chats for messages from others */}
        {isGroup && !isOwnMessage && (
          <div className="flex items-center gap-1">
            <p className="text-xs font-medium opacity-90">
              {message.senderId.fullName}
            </p>
            {senderIsAdmin && (
              <span className="text-xs opacity-70 flex items-center gap-0.5">
                <Shield className="w-3 h-3" /> Admin
              </span>
            )}
          </div>
        )}

        {/* Message text */}
        {message.text && <p className="break-words whitespace-pre-wrap">{message.text}</p>}
        
        {/* Message image */}
        {message.image && (
          <a 
            href={message.image} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block"
          >
            <div className="relative group/image">
              <img
                src={message.image}
                alt="Message attachment"
                className="max-w-full rounded-md hover:opacity-95 transition-opacity"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover/image:opacity-100 transition-opacity rounded-md">
                <Image className="w-6 h-6 text-white" />
              </div>
            </div>
          </a>
        )}

        {/* Message footer with timestamp and delete button */}
        <div className="flex items-center justify-end gap-2">
          <p className="text-xs opacity-70">
            {formatTime(message.createdAt)}
          </p>
          
          {canDelete && !showDeleteConfirm && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:text-error"
              title={isOwnMessage ? "Delete message" : "Delete as admin"}
            >
              <Trash2 size={16} />
            </button>
          )}

          {canDelete && showDeleteConfirm && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-xs opacity-70 hover:opacity-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-error hover:text-error-focus"
                title="Confirm delete"
              >
                {isDeleting ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <Check size={16} />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;

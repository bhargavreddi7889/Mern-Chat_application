import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useGroupStore } from '../store/useGroupStore';
import ChatHeader from './ChatHeader';
import MessageInput from './MessageInput';
import GroupMessageInput from './groups/GroupMessageInput';
import Message from './Message';
import NoChatSelected from './NoChatSelected';
import GroupChat from './groups/GroupChat';
import { Loader2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { joinGroupChat, leaveGroupChat } from '../lib/socket';

const ChatContainer = () => {
  const { 
    selectedUser, 
    messages, 
    deleteMessage, 
    loading: chatLoading, 
    sendMessage 
  } = useChatStore();

  const {
    selectedGroup,
    groupMessages,
    loading: groupLoading
  } = useGroupStore();

  // Define all hooks at the top level, before any conditional logic
  const messagesContainerRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessageAlert, setNewMessageAlert] = useState(false);

  const isGroup = !!selectedGroup;
  const currentMessages = messages[selectedUser?._id] || [];
  const loading = chatLoading;

  // Debug logging
  useEffect(() => {
    console.log('ChatContainer render state:', {
      selectedUser: selectedUser ? { id: selectedUser._id, name: selectedUser.fullName } : null,
      selectedGroup: selectedGroup ? { id: selectedGroup._id, name: selectedGroup.name } : null,
      isGroup,
      hasMessages: currentMessages.length > 0
    });
  }, [selectedUser, selectedGroup, isGroup, currentMessages.length]);

  // Handle scroll and new message alerts
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10;
      setIsAtBottom(isBottom);
      
      if (isBottom) {
        setNewMessageAlert(false);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to bottom on new messages if already at bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const wasAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10;

    if (wasAtBottom) {
      // Scroll to bottom with a slight delay to ensure content is rendered
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 100);
    } else if (currentMessages.length > 0) {
      // Show new message alert if not at bottom
      setNewMessageAlert(true);
    }
  }, [currentMessages]);

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
      setNewMessageAlert(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(messageId, false);
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const handleSendMessage = async (messageData) => {
    if (!selectedUser?._id) {
      toast.error('No chat selected');
      return;
    }

    try {
      console.log('Sending message to user:', selectedUser._id);
      await sendMessage(selectedUser._id, messageData);
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Display a more specific error message if available
      if (error?.error) {
        toast.error(error.error);
      } else if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error('Failed to send message. Please try again.');
      }
    }
  };

  // If a group is selected, render the GroupChat component
  if (isGroup) {
    console.log('Rendering GroupChat component with group:', selectedGroup.name);
    return <GroupChat />;
  }
  
  // If no user is selected, render the NoChatSelected component
  if (!selectedUser) {
    console.log('No chat selected, rendering NoChatSelected component');
    return <NoChatSelected />;
  }

  console.log('Rendering direct chat UI with user:', selectedUser.fullName);
  // Otherwise, render the direct chat UI
  return (
    <div className="flex-1 flex flex-col bg-base-200/50 relative">
      <ChatHeader 
        chat={selectedUser} 
        isGroup={false}
      />

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : currentMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-base-content/50 space-y-4">
            <p className="text-center">No messages yet. Start the conversation!</p>
            <div className="flex items-center gap-2 text-sm">
              <Send className="w-4 h-4" />
              <span>Type a message below to begin</span>
            </div>
          </div>
        ) : (
          currentMessages.map((msg) => (
            <Message
              key={msg._id}
              message={msg}
              onDelete={handleDeleteMessage}
              isGroup={false}
            />
          ))
        )}
      </div>

      {/* New Message Alert */}
      {newMessageAlert && (
        <button 
          onClick={scrollToBottom}
          className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-primary text-primary-content px-4 py-2 rounded-full shadow-lg animate-bounce"
        >
          New messages ↓
        </button>
      )}

      {/* Message Input */}
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatContainer;

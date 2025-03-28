import { useEffect } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useGroupStore } from '../store/useGroupStore';
import { getSocket } from '../lib/socket';

export const useListenMessages = () => {
  const { addMessage, handleMessageDeleted } = useChatStore();
  const { addGroupMessage, handleMessageDeleted: handleGroupMessageDeleted } = useGroupStore();

  useEffect(() => {
    const socket = getSocket();
    
    // Skip if socket is not initialized
    if (!socket) return;

    // Direct message handlers
    const handleNewMessage = (message) => {
      console.log('New direct message received:', message);
      addMessage(message);
    };

    const handleMessageDeleted = (data) => {
      console.log('Message deleted:', data);
      const { messageId, userId, groupId } = data;
      
      if (groupId) {
        // Handle group message deletion
        handleGroupMessageDeleted(messageId, groupId);
      } else if (userId) {
        // Handle direct message deletion
        handleMessageDeleted(messageId, userId);
      }
    };

    // Group message handlers
    const handleNewGroupMessage = (data) => {
      console.log('New group message received:', data);
      const { groupId, message } = data;
      if (groupId && message) {
        addGroupMessage(groupId, message);
      }
    };

    // Add event listeners
    socket.on('newMessage', handleNewMessage);
    socket.on('messageDeleted', handleMessageDeleted);
    socket.on('new-group-message', handleNewGroupMessage);

    // Cleanup function
    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messageDeleted', handleMessageDeleted);
      socket.off('new-group-message', handleNewGroupMessage);
    };
  }, [addMessage, handleMessageDeleted, addGroupMessage, handleGroupMessageDeleted]);
};

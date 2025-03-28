import React, { useState } from 'react';
import { useGroupStore } from '../../store/useGroupStore';
import toast from 'react-hot-toast';
import { Send } from 'lucide-react';
import Spinner from '../../components/Spinner';

const GroupMessageInput = ({ groupId }) => {
  const { sendGroupMessage } = useGroupStore();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Don't submit if no message
    if (!message.trim()) return;
    
    try {
      setIsSending(true);
      
      // Create a simple object with text
      const messageData = {
        text: message.trim()
      };
      
      // Send the message
      await sendGroupMessage(groupId, messageData);
      
      // Reset form
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md"
    >
      {/* Text input */}
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 bg-transparent border-none outline-none text-gray-700 dark:text-gray-200"
      />
      
      {/* Send button */}
      <button
        type="submit"
        disabled={isSending || !message.trim()}
        className={`p-2 rounded-full ${
          isSending || !message.trim()
            ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {isSending ? <Spinner size="sm" /> : <Send size={20} />}
      </button>
    </form>
  );
};

export default GroupMessageInput;

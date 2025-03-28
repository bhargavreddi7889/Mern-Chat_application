import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';

export const useChatStore = create((set, get) => ({
  selectedUser: null,
  selectedGroup: null,
  messages: {},
  groupMessages: {},
  users: [],
  loading: false,
  error: null,
  lastFetch: null,

  setSelectedUser: (user) => {
    set({ 
      selectedUser: user,
      selectedGroup: null // Clear selected group when selecting a user
    });
    if (user?._id) {
      get().getMessages(user._id, false);
    }
  },

  setSelectedGroup: (group) => {
    set({ 
      selectedGroup: group,
      selectedUser: null // Clear selected user when selecting a group
    });
    if (group?._id) {
      get().getMessages(group._id, true);
    }
  },

  fetchUsers: async (force = false) => {
    const state = get();
    const now = Date.now();
    const FETCH_COOLDOWN = 10000; // 10 seconds

    if (!force && state.lastFetch && now - state.lastFetch < FETCH_COOLDOWN) {
      return state.users;
    }

    try {
      set({ loading: true, error: null });
      const response = await axiosInstance.get('/users');
      set({ 
        users: response.data, 
        loading: false,
        lastFetch: now,
        error: null 
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      set({ 
        loading: false, 
        error: 'Failed to fetch users',
        lastFetch: null
      });
      throw error;
    }
  },

  getMessages: async (id, isGroup = false) => {
    try {
      const response = await axiosInstance.get(`/messages/${id}?isGroup=${isGroup}`);
      set(state => ({
        [isGroup ? 'groupMessages' : 'messages']: {
          ...state[isGroup ? 'groupMessages' : 'messages'],
          [id]: response.data
        }
      }));
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to fetch messages');
      throw error;
    }
  },

  sendMessage: async (receiverId, { text, isGroup = false }) => {
    try {
      set({ loading: true });
      console.log('Sending message:', {
        receiverId,
        isGroup,
        text
      });

      // Make the API request with JSON data
      const response = await axiosInstance.post(
        `/messages/send/${receiverId}`,
        { text, isGroup }
      );

      // Update the appropriate message store based on isGroup flag
      set(state => {
        const messageStore = isGroup ? 'groupMessages' : 'messages';
        const currentMessages = state[messageStore][receiverId] || [];
        
        return {
          loading: false,
          [messageStore]: {
            ...state[messageStore],
            [receiverId]: [...currentMessages, response.data]
          }
        };
      });

      return response.data;
    } catch (error) {
      console.error('Error sending message:', error.response?.data || error);
      set({ loading: false });
      throw error.response?.data || error;
    }
  },

  deleteMessage: async (messageId, isGroup = false) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      
      // Update the appropriate message store
      set(state => {
        const messageStore = isGroup ? 'groupMessages' : 'messages';
        const updatedMessages = {};
        Object.entries(state[messageStore]).forEach(([id, messages]) => {
          updatedMessages[id] = messages.filter(msg => msg._id !== messageId);
        });
        return { [messageStore]: updatedMessages };
      });

      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
      throw error;
    }
  },

  addMessage: (message, isGroup = false) => {
    if (!message?.senderId?._id) return;
    
    const targetId = isGroup ? message.groupId : message.senderId._id;
    if (!targetId) return;

    set(state => ({
      [isGroup ? 'groupMessages' : 'messages']: {
        ...state[isGroup ? 'groupMessages' : 'messages'],
        [targetId]: [...(state[isGroup ? 'groupMessages' : 'messages'][targetId] || []), message]
      }
    }));
  },

  handleMessageDeleted: (messageId, targetId, isGroup = false) => {
    if (!targetId) return;

    set(state => ({
      [isGroup ? 'groupMessages' : 'messages']: {
        ...state[isGroup ? 'groupMessages' : 'messages'],
        [targetId]: (state[isGroup ? 'groupMessages' : 'messages'][targetId] || [])
          .filter(msg => msg._id !== messageId)
      }
    }));
  },

  updateUser: (userId, userData) => {
    set(state => ({
      users: state.users.map(user => 
        user._id === userId ? { ...user, ...userData } : user
      )
    }));
  }
}));

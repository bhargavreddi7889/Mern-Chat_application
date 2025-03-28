import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';

export const useGroupStore = create((set, get) => ({
  groups: [],
  selectedGroup: null,
  groupMessages: {},
  isLoading: false,
  sendingMessage: false,

  fetchUserGroups: async (userId) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.get(`/groups/user/${userId}`);
      set({ groups: response.data });
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to fetch groups');
    } finally {
      set({ isLoading: false });
    }
  },

  createGroup: async (groupData) => {
    try {
      const response = await axiosInstance.post('/groups/create', groupData);
      set(state => ({ groups: [...state.groups, response.data] }));
      return response.data;
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error(error.response?.data?.message || 'Failed to create group');
      throw error;
    }
  },

  addMembers: async (groupId, userIds, adminId) => {
    try {
      const response = await axiosInstance.post(`/groups/${groupId}/members`, {
        userIds,
        adminId
      });
      set(state => ({
        groups: state.groups.map(group => 
          group._id === groupId ? response.data : group
        )
      }));
      return response.data;
    } catch (error) {
      console.error('Error adding members:', error);
      toast.error(error.response?.data?.message || 'Failed to add members');
      throw error;
    }
  },

  removeMember: async (groupId, userId, adminId) => {
    try {
      const response = await axiosInstance.delete(`/groups/${groupId}/members/${userId}`, {
        data: { adminId }
      });
      set(state => ({
        groups: state.groups.map(group => 
          group._id === groupId ? response.data : group
        )
      }));
      return response.data;
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error(error.response?.data?.message || 'Failed to remove member');
      throw error;
    }
  },

  promoteToAdmin: async (groupId, userId, adminId) => {
    try {
      const response = await axiosInstance.patch(`/groups/${groupId}/admins`, {
        userId,
        adminId
      });
      set(state => ({
        groups: state.groups.map(group => 
          group._id === groupId ? response.data : group
        )
      }));
      return response.data;
    } catch (error) {
      console.error('Error promoting member:', error);
      toast.error(error.response?.data?.message || 'Failed to promote member');
      throw error;
    }
  },

  getGroupMessages: async (groupId) => {
    try {
      const response = await axiosInstance.get(`/groups/${groupId}/messages`);
      set(state => ({
        groupMessages: {
          ...state.groupMessages,
          [groupId]: response.data
        }
      }));
      return response.data;
    } catch (error) {
      console.error('Error fetching group messages:', error);
      toast.error('Failed to fetch group messages');
      throw error;
    }
  },

  sendGroupMessage: async (groupId, { text }) => {
    try {
      set({ sendingMessage: true });
      
      console.log('Sending group message to group:', groupId);
      
      // Make API request to send message using axiosInstance
      const response = await axiosInstance.post(
        `/groups/${groupId}/messages`, 
        { text }
      );
      
      const newMessage = response.data;
      
      // Update local state with new message, but check for duplicates first
      set((state) => {
        const currentMessages = state.groupMessages[groupId] || [];
        
        // Check if message already exists to prevent duplicates
        if (currentMessages.some(msg => msg._id === newMessage._id)) {
          return state; // Return unchanged state if message already exists
        }
        
        return {
          groupMessages: {
            ...state.groupMessages,
            [groupId]: [...currentMessages, newMessage]
          }
        };
      });
      
      return newMessage;
    } catch (error) {
      console.error('Error sending group message:', error);
      toast.error(error.message || 'Failed to send message');
      throw error;
    } finally {
      set({ sendingMessage: false });
    }
  },

  deleteGroup: async (groupId) => {
    try {
      await axiosInstance.delete(`/groups/${groupId}`);
      
      set(state => ({
        groups: state.groups.filter(group => group._id !== groupId),
        selectedGroup: state.selectedGroup?._id === groupId ? null : state.selectedGroup,
        groupMessages: {
          ...state.groupMessages,
          [groupId]: undefined
        }
      }));
      
      return true;
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error(error.response?.data?.message || 'Failed to delete group');
      throw error;
    }
  },

  deleteGroupMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      
      // Update messages in all groups since we don't know which group the message belongs to
      set(state => {
        const updatedGroupMessages = {};
        Object.entries(state.groupMessages).forEach(([groupId, messages]) => {
          updatedGroupMessages[groupId] = messages.filter(msg => msg._id !== messageId);
        });
        return { groupMessages: updatedGroupMessages };
      });

      toast.success('Message deleted');
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
      throw error;
    }
  },

  setSelectedGroup: (group) => {
    set({ selectedGroup: group });
    if (group?._id && !get().groupMessages[group._id]) {
      get().getGroupMessages(group._id);
    }
  },
  

  // Socket event handlers
  addGroupMessage: (groupId, message) => {
    set(state => {
      const currentMessages = state.groupMessages[groupId] || [];
      
      // Check if message already exists in the current messages
      if (currentMessages.some(msg => msg._id === message._id)) {
        console.log("Duplicate message prevented in addGroupMessage:", message._id);
        return state; // Return unchanged state
      }
      
      console.log("Adding new group message to state:", message._id);
      return {
        groupMessages: {
          ...state.groupMessages,
          [groupId]: [...currentMessages, message]
        }
      };
    });
  },

  handleMessageDeleted: (messageId, groupId) => {
    if (!groupId) return;

    set(state => ({
      groupMessages: {
        ...state.groupMessages,
        [groupId]: (state.groupMessages[groupId] || []).filter(msg => msg._id !== messageId)
      }
    }));
  },

  handleNewGroup: (group) => {
    set(state => ({
      groups: [...state.groups, group]
    }));
  },

  handleGroupUpdated: (updatedGroup) => {
    set(state => ({
      groups: state.groups.map(group => 
        group._id === updatedGroup._id ? updatedGroup : group
      ),
      selectedGroup: state.selectedGroup?._id === updatedGroup._id ? updatedGroup : state.selectedGroup
    }));
  },

  handleRemovedFromGroup: (groupId) => {
    set(state => ({
      groups: state.groups.filter(group => group._id !== groupId),
      selectedGroup: state.selectedGroup?._id === groupId ? null : state.selectedGroup,
      groupMessages: {
        ...state.groupMessages,
        [groupId]: undefined
      }
    }));
  }
}));

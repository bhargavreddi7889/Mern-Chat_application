import React, { useRef, useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useGroupStore } from '../../store/useGroupStore';
import { joinGroupChat, leaveGroupChat } from '../../lib/socket';
import GroupMessageInput from './GroupMessageInput';
import Message from '../Message';
import { Loader2, Users, Info, Send, Shield, Settings } from 'lucide-react';
import GroupInfo from './GroupInfo';
import toast from 'react-hot-toast';

const GroupChat = () => {
  const { authUser } = useAuthStore();
  const { selectedGroup, groupMessages, loading, deleteGroupMessage } = useGroupStore();
  const messagesContainerRef = useRef(null);
  const prevGroupIdRef = useRef(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessageAlert, setNewMessageAlert] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('GroupChat component mounted/updated with:', {
      selectedGroup: selectedGroup ? { 
        id: selectedGroup._id, 
        name: selectedGroup.name,
        memberCount: selectedGroup.members?.length || 0
      } : null,
      hasMessages: selectedGroup ? (groupMessages[selectedGroup._id]?.length || 0) : 0,
      authUser: authUser ? { id: authUser._id } : null
    });
  }, [selectedGroup, groupMessages, authUser]);

  const currentGroupMessages = groupMessages[selectedGroup?._id] || [];
  
  // Check if current user is an admin
  const isAdmin = selectedGroup?.members?.some(
    member => member.user._id === authUser?._id && member.role === 'admin'
  );

  // Debug admin status
  useEffect(() => {
    if (selectedGroup) {
      console.log('Admin status check:', {
        isAdmin,
        authUserId: authUser?._id,
        groupMembers: selectedGroup.members?.map(m => ({
          userId: m.user._id,
          role: m.role,
          isCurrentUser: m.user._id === authUser?._id
        }))
      });
    }
  }, [selectedGroup, authUser, isAdmin]);

  // Join the group chat room when the selected group changes
  useEffect(() => {
    if (selectedGroup?._id) {
      // Leave previous group if exists
      if (prevGroupIdRef.current && prevGroupIdRef.current !== selectedGroup._id) {
        leaveGroupChat(prevGroupIdRef.current);
      }
      
      // Join new group
      joinGroupChat(selectedGroup._id);
      prevGroupIdRef.current = selectedGroup._id;
    }
    
    return () => {
      // Leave group when component unmounts
      if (selectedGroup?._id) {
        leaveGroupChat(selectedGroup._id);
      }
    };
  }, [selectedGroup?._id]);

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
    } else if (currentGroupMessages.length > 0) {
      // Show new message alert if not at bottom
      setNewMessageAlert(true);
    }
  }, [currentGroupMessages]);

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
      setNewMessageAlert(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteGroupMessage(messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  // Early return if no group is selected
  if (!selectedGroup) {
    console.log('No group selected in GroupChat component');
    return (
      <div className="flex-1 flex items-center justify-center bg-base-200/50">
        <p className="text-base-content/60">Select a group to start chatting</p>
      </div>
    );
  }

  console.log('Rendering GroupChat UI for group:', selectedGroup.name);
  return (
    <div className="flex-1 flex flex-col bg-base-200/50 relative">
      {/* Group Header */}
      <div className="p-4 bg-base-200 border-b border-base-300 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-content" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{selectedGroup.name}</h2>
              {isAdmin && (
                <div className="badge badge-primary gap-1 text-xs">
                  <Shield className="w-3 h-3" />
                  Admin
                </div>
              )}
            </div>
            <p className="text-sm text-base-content/70 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {selectedGroup.members?.length || 0} members
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowGroupInfo(true)}
            className="btn btn-ghost btn-sm btn-circle"
            title="Group Info"
          >
            <Info className="w-5 h-5" />
          </button>
          {isAdmin && (
            <button 
              onClick={() => setShowGroupInfo(true)}
              className="btn btn-ghost btn-sm btn-circle"
              title="Group Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : currentGroupMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-base-content/50 space-y-4">
            <p className="text-center">No messages yet in this group.</p>
            <div className="flex items-center gap-2 text-sm">
              <Send className="w-4 h-4" />
              <span>Be the first to send a message!</span>
            </div>
          </div>
        ) : (
          currentGroupMessages.map((msg) => (
            <Message
              key={msg._id}
              message={msg}
              onDelete={handleDeleteMessage}
              isGroup={true}
              isAdmin={isAdmin}
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
      <GroupMessageInput groupId={selectedGroup._id} />

      {/* Group Info Modal */}
      {showGroupInfo && (
        <GroupInfo 
          group={selectedGroup} 
          onClose={() => setShowGroupInfo(false)} 
        />
      )}
    </div>
  );
};

export default GroupChat;

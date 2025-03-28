import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatStore } from '../../store/useChatStore';
import { useGroupStore } from '../../store/useGroupStore';
import { Users, Search, X, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateGroup = ({ onClose, onGroupCreated }) => {
  const { authUser } = useAuthStore();
  const { users, loading: usersLoading, fetchUsers } = useChatStore();
  const { createGroup } = useGroupStore();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (loading) return; // Prevent multiple submissions
    
    if (selectedMembers.length === 0) {
      toast.error('Please select at least one member');
      return;
    }

    setLoading(true);
    
    try {
      const groupData = {
        name: groupName.trim(),
        description: description.trim(),
        members: selectedMembers,
        creatorId: authUser._id
      };

      const newGroup = await createGroup(groupData);
      toast.success('Group created successfully!');
      
      // Close modal immediately to prevent multiple submissions
      onClose();
      
      // Notify parent component after a short delay
      setTimeout(() => {
        if (onGroupCreated) {
          onGroupCreated(newGroup);
        }
      }, 100);
    } catch (error) {
      console.error('Error creating group:', error?.response?.data || error.message);
      toast.error(error?.response?.data?.message || 'Failed to create group');
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  const toggleMemberSelection = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  const filteredUsers = users?.filter(user => {
    return user?._id !== authUser?._id && (
      user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }) || [];

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" 
      onClick={handleOverlayClick}
    >
      <div 
        className="bg-base-200 rounded-lg p-6 w-full max-w-md shadow-xl border border-base-300" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Create New Group</h2>
          <button 
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
            disabled={loading}
          >
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">
              <span className="label-text font-medium">Group Name</span>
            </label>
            <input
              type="text"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="input input-bordered w-full"
              required
              minLength={3}
              maxLength={50}
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="label">
              <span className="label-text font-medium">Description</span>
            </label>
            <textarea
              placeholder="Group description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="textarea textarea-bordered w-full"
              rows="2"
              maxLength={200}
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="label">
              <span className="label-text font-medium">Members</span>
              <span className="label-text-alt">{selectedMembers.length} selected</span>
            </label>
            
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-bordered w-full pl-10"
                disabled={loading}
              />
            </div>
            
            <div className="max-h-48 overflow-y-auto border rounded-lg bg-base-100">
              {filteredUsers.length > 0 ? (
                <ul className="menu p-0">
                  {filteredUsers.map(user => (
                    <li key={user._id}>
                      <button
                        type="button"
                        className={`flex items-center p-2 hover:bg-base-200 ${
                          selectedMembers.includes(user._id) ? 'bg-base-200' : ''
                        }`}
                        onClick={() => toggleMemberSelection(user._id)}
                        disabled={loading}
                      >
                        <div className="flex items-center w-full">
                          <div className="avatar mr-2">
                            <div className="w-8 h-8 rounded-full">
                              <img 
                                src={user.profilePic || "/avatar.png"} 
                                alt={user.fullName} 
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "/avatar.png";
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium">{user.fullName}</p>
                            <p className="text-xs opacity-70">@{user.username}</p>
                          </div>
                          {selectedMembers.includes(user._id) && (
                            <CheckCircle className="w-5 h-5 text-success" />
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-base-content/60">
                  {usersLoading ? 'Loading users...' : 'No users found'}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !groupName.trim() || selectedMembers.length === 0}
              className="btn btn-primary"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating...
                </>
              ) : (
                'Create Group'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroup;

import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { useGroupStore } from '../store/useGroupStore';
import UserList from './UserList';
import GroupList from './groups/GroupList';
import CreateGroup from './groups/CreateGroup';
import { Users, MessageSquare, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Sidebar = () => {
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [activeTab, setActiveTab] = useState('chats');
  const { selectedUser, setSelectedUser, loading, fetchUsers, error } = useChatStore();
  const { selectedGroup, setSelectedGroup } = useGroupStore();
  const { authUser } = useAuthStore();

  useEffect(() => {
    const loadUsers = async () => {
      try {
        if (authUser) {
          await fetchUsers();
        }
      } catch (error) {
        toast.error(error?.response?.data?.error || 'Failed to load users');
      }
    };

    loadUsers();

    // Set up periodic refresh
    const refreshInterval = setInterval(() => {
      if (authUser && activeTab === 'chats') {
        fetchUsers(true).catch(() => {}); // Force refresh
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [authUser, fetchUsers, activeTab]);

  const handleUserSelect = (user) => {
    if (!user) return;
    console.log('Selecting user:', user.fullName, user._id);
    setSelectedUser(user);
    setSelectedGroup(null);
  };

  const handleGroupSelect = (group) => {
    if (!group) return;
    console.log('Selecting group:', group.name, group._id);
    setSelectedGroup(group);
    setSelectedUser(null);
    
    // Debug the state after selection
    setTimeout(() => {
      const currentSelectedGroup = useGroupStore.getState().selectedGroup;
      console.log('Group selection state after update:', {
        selectedGroupInStore: currentSelectedGroup ? {
          id: currentSelectedGroup._id,
          name: currentSelectedGroup.name
        } : null
      });
    }, 100);
  };

  return (
    <div className="w-[300px] h-full border-r flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('chats')}
              className={`btn btn-sm ${activeTab === 'chats' ? 'btn-primary' : 'btn-ghost'}`}
              disabled={loading}
            >
              <MessageSquare className="w-4 h-4" />
              Chats
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`btn btn-sm ${activeTab === 'groups' ? 'btn-primary' : 'btn-ghost'}`}
              disabled={loading}
            >
              <Users className="w-4 h-4" />
              Groups
            </button>
          </div>
          {activeTab === 'groups' && (
            <button
              onClick={() => setShowCreateGroup(true)}
              className="btn btn-circle btn-ghost btn-sm"
              title="Create Group"
              disabled={loading}
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-error">
            <p className="text-center px-4">{error}</p>
          </div>
        ) : activeTab === 'chats' ? (
          <UserList onUserSelect={handleUserSelect} />
        ) : (
          <GroupList onGroupSelect={handleGroupSelect} />
        )}
      </div>

      {showCreateGroup && (
        <CreateGroup onClose={() => setShowCreateGroup(false)} />
      )}
    </div>
  );
};

export default Sidebar;

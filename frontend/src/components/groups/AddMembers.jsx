import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useGroupStore } from '../../store/useGroupStore';
import { useChatStore } from '../../store/useChatStore';
import { Search, UserPlus, Check, X, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const AddMembers = ({ group, onClose }) => {
  const { authUser } = useAuthStore();
  const { addMembers } = useGroupStore();
  const { users, getUsers } = useChatStore();
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        await getUsers();
      } catch (error) {
        toast.error('Failed to fetch users');
      } finally {
        setLoadingUsers(false);
      }
    };
    
    fetchUsers();
  }, [getUsers]);

  const existingMemberIds = group.members.map(m => m.user._id);
  const filteredUsers = users.filter(user => 
    !existingMemberIds.includes(user._id) &&
    user._id !== authUser._id &&
    (user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.username?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    try {
      setLoading(true);
      await addMembers(group._id, selectedUsers, authUser._id);
      toast.success(`${selectedUsers.length} member${selectedUsers.length > 1 ? 's' : ''} added successfully`);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add members');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    } else {
      setSelectedUsers(prev => [...prev, userId]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-base-200 rounded-lg p-6 w-full max-w-md max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Add Members</h2>
            {selectedUsers.length > 0 && (
              <div className="badge badge-primary">{selectedUsers.length}</div>
            )}
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm">✕</button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/50" />
          <input
            type="text"
            placeholder="Search by name or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-bordered w-full pl-10"
            autoFocus
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {loadingUsers ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="loading loading-spinner loading-md text-primary"></span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto mb-6 rounded-lg border border-base-300">
            {filteredUsers.length > 0 ? (
              <div className="space-y-1 p-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => toggleUserSelection(user._id)}
                    className={`flex items-center justify-between p-3 hover:bg-base-300 rounded-lg cursor-pointer transition-colors ${
                      selectedUsers.includes(user._id) ? 'bg-base-300' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={user.profilePic || "/avatar.png"}
                        alt={user.fullName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-base-300"
                      />
                      <div>
                        <p className="font-medium">{user.fullName}</p>
                        {user.username && (
                          <p className="text-xs text-base-content/70">@{user.username}</p>
                        )}
                      </div>
                    </div>

                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      selectedUsers.includes(user._id) 
                        ? 'bg-primary text-primary-content' 
                        : 'border-2 border-base-content/30'
                    }`}>
                      {selectedUsers.includes(user._id) && (
                        <Check className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-base-content/50 p-4">
                <Users className="w-8 h-8 mb-2" />
                <p className="text-center">
                  {searchQuery 
                    ? `No users found matching "${searchQuery}"`
                    : "No users available to add"}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 mt-auto">
          <button
            onClick={onClose}
            className="btn btn-ghost flex-1"
          >
            Cancel
          </button>
          <button
            onClick={handleAddMembers}
            disabled={loading || selectedUsers.length === 0}
            className="btn btn-primary flex-1 gap-2"
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Adding...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Add {selectedUsers.length > 0 ? `(${selectedUsers.length})` : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMembers;

import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { Search, Loader2 } from 'lucide-react';

const UserList = ({ onUserSelect }) => {
  const { users, loading } = useChatStore();
  const { authUser, onlineUsers } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users?.filter(user => 
    user && 
    user._id !== authUser?._id &&
    (user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="px-4">
        <h3 className="font-semibold mb-2">Users ({filteredUsers.length})</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/50" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-bordered w-full pl-10"
          />
        </div>
      </div>

      <div className="space-y-2 px-2">
        {filteredUsers.map((user) => (
          <button
            key={user._id}
            onClick={() => onUserSelect(user)}
            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-base-200 transition-colors rounded-lg"
          >
            <div className="avatar">
              <div className="w-12 h-12 rounded-full relative">
                <img 
                  src={user.profilePic || "/avatar.png"} 
                  alt={user.fullName}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/avatar.png";
                  }}
                />
                {onlineUsers?.includes(user._id) && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-base-100" />
                )}
              </div>
            </div>
            <div className="flex-1 text-left">
              <h4 className="font-medium">{user.fullName}</h4>
              <p className="text-sm opacity-70">
                @{user.username || 'user'}
                {onlineUsers?.includes(user._id) && ' • Online'}
              </p>
            </div>
          </button>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-base-content/60">
            <p>No users found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;

import { useEffect } from 'react';
import { useGroupStore } from '../../store/useGroupStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Users } from 'lucide-react';

const GroupList = ({ onGroupSelect }) => {
  const { groups, fetchUserGroups, selectedGroup } = useGroupStore();
  const { authUser } = useAuthStore();

  useEffect(() => {
    if (authUser?._id) {
      console.log('Fetching groups for user:', authUser._id);
      fetchUserGroups(authUser._id);
    }
  }, [authUser?._id, fetchUserGroups]);

  // Debug groups data
  useEffect(() => {
    console.log('GroupList received groups:', groups?.length || 0, 'groups');
    if (groups?.length > 0) {
      console.log('First group sample:', {
        id: groups[0]._id,
        name: groups[0].name,
        memberCount: groups[0].members?.length || 0
      });
    }
  }, [groups]);

  const handleGroupSelect = (group) => {
    console.log('Group selected in GroupList:', group.name, group._id);
    if (onGroupSelect) {
      onGroupSelect(group);
    }
  };

  if (!groups?.length) {
    console.log('No groups available to display');
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-base-content/50">
        <Users className="w-12 h-12 mb-2" />
        <p className="text-center">No groups yet. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold px-4">Groups</h3>
      <div className="space-y-2">
        {groups.map((group) => (
          <button
            key={group._id}
            onClick={() => handleGroupSelect(group)}
            className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-base-200 transition-colors ${
              selectedGroup?._id === group._id ? 'bg-base-200' : ''
            }`}
          >
            <div className="avatar">
              {group.image ? (
                <div className="w-12 rounded-full">
                  <img 
                    src={group.image} 
                    alt={group.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/avatar.png";
                    }}
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary-content" />
                </div>
              )}
            </div>
            <div className="flex-1 text-left">
              <h4 className="font-medium">{group.name}</h4>
              <p className="text-sm opacity-70">
                {group.members?.length || 0} members
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default GroupList;

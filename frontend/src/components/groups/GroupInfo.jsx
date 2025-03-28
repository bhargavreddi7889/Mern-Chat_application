import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useGroupStore } from '../../store/useGroupStore';
import { Shield, UserPlus, UserMinus, Crown, Trash2, LogOut, Users } from 'lucide-react';
import AddMembers from './AddMembers';
import toast from 'react-hot-toast';

const GroupInfo = ({ group, onClose }) => {
  const { authUser } = useAuthStore();
  const { removeMember, promoteToAdmin, deleteGroup, setSelectedGroup } = useGroupStore();
  const [loading, setLoading] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  // Check if current user is an admin
  const isAdmin = group.members.some(m => 
    m.user._id === authUser._id && m.role === 'admin'
  );
  
  // Check if current user is the only admin
  const isSingleAdmin = isAdmin && 
    group.members.filter(m => m.role === 'admin').length === 1;

  const handleRemoveMember = async (userId) => {
    if (!isAdmin) {
      toast.error('Only admins can remove members');
      return;
    }
    
    try {
      setLoading(true);
      await removeMember(group._id, userId, authUser._id);
      toast.success('Member removed successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteToAdmin = async (userId) => {
    if (!isAdmin) {
      toast.error('Only admins can promote members');
      return;
    }
    
    try {
      setLoading(true);
      await promoteToAdmin(group._id, userId, authUser._id);
      toast.success('Member promoted to admin');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to promote member');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (isSingleAdmin) {
      toast.error('You cannot leave the group as you are the only admin');
      return;
    }
    
    try {
      setLoading(true);
      await removeMember(group._id, authUser._id, authUser._id);
      toast.success('Left group successfully');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to leave group');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!isAdmin) {
      toast.error('Only admins can delete the group');
      return;
    }
    
    try {
      setLoading(true);
      await deleteGroup(group._id);
      setSelectedGroup(null);
      toast.success('Group deleted successfully');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete group');
    } finally {
      setLoading(false);
      setShowConfirmDelete(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
        <div className="bg-base-200 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">{group.name}</h2>
            <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm">✕</button>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Description</h3>
            <p className="text-base-content/70">{group.description || 'No description'}</p>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium">Members</h3>
                <div className="badge badge-primary">{group.members.length}</div>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowAddMembers(true)}
                  className="btn btn-primary btn-sm gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Add
                </button>
              )}
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 rounded-lg border border-base-300 p-2">
              {group.members.map((member) => (
                <div key={member.user._id} className="flex items-center justify-between p-2 hover:bg-base-300 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <img
                      src={member.user.profilePic || "/avatar.png"}
                      alt={member.user.fullName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-base-300"
                    />
                    <div>
                      <p className="font-medium">{member.user.fullName}</p>
                      {member.role === 'admin' && (
                        <p className="text-xs flex items-center gap-1 text-primary">
                          <Shield className="w-3 h-3" /> Admin
                        </p>
                      )}
                      {member.user._id === authUser._id && (
                        <p className="text-xs text-secondary">You</p>
                      )}
                    </div>
                  </div>

                  {isAdmin && member.user._id !== authUser._id && (
                    <div className="flex gap-1">
                      {member.role !== 'admin' && (
                        <button
                          onClick={() => handlePromoteToAdmin(member.user._id)}
                          disabled={loading}
                          className="btn btn-ghost btn-sm btn-square tooltip tooltip-left"
                          data-tip="Make Admin"
                        >
                          <Crown className="w-4 h-4 text-warning" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveMember(member.user._id)}
                        disabled={loading}
                        className="btn btn-ghost btn-sm btn-square tooltip tooltip-left"
                        data-tip="Remove Member"
                      >
                        <UserMinus className="w-4 h-4 text-error" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-base-300 space-y-3">
            <button
              onClick={handleLeaveGroup}
              disabled={loading || isSingleAdmin}
              className="btn btn-outline btn-error btn-block gap-2"
            >
              <LogOut className="w-4 h-4" />
              {isSingleAdmin ? "Cannot leave (you're the only admin)" : "Leave Group"}
            </button>
            
            {isAdmin && (
              <button
                onClick={() => setShowConfirmDelete(true)}
                disabled={loading}
                className="btn btn-error btn-block gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Group
              </button>
            )}
          </div>
        </div>
      </div>

      {showAddMembers && (
        <AddMembers
          group={group}
          onClose={() => setShowAddMembers(false)}
        />
      )}

      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]" onClick={() => setShowConfirmDelete(false)}>
          <div className="bg-base-200 rounded-lg p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Delete Group</h3>
            <p className="mb-6">Are you sure you want to delete this group? This action cannot be undone and all messages will be permanently deleted.</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowConfirmDelete(false)} 
                className="btn btn-ghost"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteGroup} 
                className="btn btn-error"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GroupInfo;

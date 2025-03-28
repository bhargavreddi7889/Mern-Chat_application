import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User } from "lucide-react";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [previewUrl, setPreviewUrl] = useState(null);

  // Reset preview when authUser changes (e.g., after successful update)
  useEffect(() => {
    if (authUser?.profilePic) {
      setPreviewUrl(null);
    }
  }, [authUser?.profilePic]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/i)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, WEBP)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }
  
    // Show preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    // Create a new FormData instance
    const formData = new FormData();
    
    // Append the file with the correct field name
    formData.append("profilePic", file);
    
    console.log('Uploading profile picture:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: `${(file.size / 1024).toFixed(2)} KB`
    });
  
    // Show loading toast
    const loadingToast = toast.loading('Uploading profile picture...');
    
    try {
      // Pass the FormData directly to updateProfile
      await updateProfile(formData);
      
      // Success toast
      toast.dismiss(loadingToast);
      toast.success('Profile picture updated successfully');
    } catch (error) {
      // Error handling
      toast.dismiss(loadingToast);
      console.error("Error updating profile:", error);
      
      // Show specific error message if available
      if (error?.error) {
        toast.error(error.error);
      } else {
        toast.error("Failed to update profile picture");
      }
      
      // Reset preview on error
      setPreviewUrl(null);
    }
  };
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-300 to-base-100 pt-16">
      <div className="container mx-auto p-6">
        <div className="bg-base-100 rounded-xl shadow-xl p-6 max-w-2xl mx-auto border border-base-300">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Profile</h1>
            <p className="text-base-content/70 mt-2">Your profile information</p>
          </div>

          {/* avatar upload section */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="relative">
              <img
                src={previewUrl || authUser?.profilePic || "/avatar.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4 border-base-300"
                key={previewUrl || authUser?.profilePic} // Force re-render when image changes
              />
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0 
                  bg-primary hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                `}
              >
                <Camera className="w-5 h-5 text-primary-content" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <p className="text-sm text-base-content/60">
              {isUpdatingProfile ? "Uploading..." : "Click the camera icon to update your photo"}
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="text-sm text-base-content/60 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border border-base-300">{authUser?.fullName}</p>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-base-content/60 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border border-base-300">{authUser?.email}</p>
            </div>
          </div>

          <div className="mt-6 bg-base-200 rounded-xl p-6 border border-base-300">
            <h2 className="text-lg font-medium mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-base-300">
                <span>Member Since</span>
                <span>{authUser?.createdAt?.split("T")[0]}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Account Status</span>
                <span className="text-success font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProfilePage;
